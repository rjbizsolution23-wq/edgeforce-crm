"""
EdgeForce AI Worker - FastAPI Server
Handles email processing, AI agents, and async tasks
"""

import os
import asyncio
import json
from contextlib import asynccontextmanager
from typing import Optional, Union, List, Dict, Any
from datetime import datetime

from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings
import structlog
import httpx

# Configure structured logging
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ]
)
logger = structlog.get_logger()


# ============================================================================
# Settings
# ============================================================================

class Settings(BaseSettings):
    # Database
    database_url: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://localhost/edgeforce")

    # Redis
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")

    # AI Providers
    openai_api_key: Optional[str] = os.getenv("OPENAI_API_KEY")
    anthropic_api_key: Optional[str] = os.getenv("ANTHROPIC_API_KEY")
    huggingface_token: Optional[str] = os.getenv("HUGGINGFACE_TOKEN")
    openrouter_api_key: Optional[str] = os.getenv("OPENROUTER_API_KEY")

    # Cloudflare
    cf_account_id: str = os.getenv("CF_ACCOUNT_ID", "")
    cf_api_token: str = os.getenv("CF_API_TOKEN", "")

    # App
    app_name: str = "EdgeForce AI Worker"
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()


# ============================================================================
# LLM Clients
# ============================================================================

class OpenRouterClient:
    """OpenRouter API client for accessing 100+ models"""
    BASE_URL = "https://openrouter.ai/api/v1"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = httpx.AsyncClient(
            headers={
                "Authorization": f"Bearer {api_key}",
                "HTTP-Referer": "https://edgeforce-crm.rjbusinesssolutions.org",
                "X-Title": "EdgeForce CRM"
            },
            timeout=120.0
        )

    async def chat(
        self,
        model: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2000,
        stream: bool = False
    ) -> Union[Dict, AsyncIterator]:
        """Send chat completion request"""
        url = f"{self.BASE_URL}/chat/completions"
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream
        }

        response = await self.client.post(url, json=payload)
        response.raise_for_status()
        return response.json()

    async def chat_stream(self, model: str, messages: List[Dict], temperature: float = 0.7, max_tokens: int = 2000):
        """Streaming chat completion"""
        url = f"{self.BASE_URL}/chat/completions"
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True
        }

        async with self.client.stream("POST", url, json=payload) as response:
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data = line[6:]
                    if data == "[DONE]":
                        break
                    try:
                        yield data + "\n"
                    except:
                        pass

    async def list_models(self) -> Dict:
        """List available models"""
        url = f"{self.BASE_URL}/models"
        response = await self.client.get(url)
        response.raise_for_status()
        return response.json()

    async def close(self):
        await self.client.aclose()


class HuggingFaceClient:
    """HuggingFace Inference API client"""
    BASE_URL = "https://api-inference.huggingface.co/models"

    def __init__(self, token: str):
        self.token = token
        self.client = httpx.AsyncClient(
            headers={"Authorization": f"Bearer {token}"},
            timeout=120.0
        )

    async def generate(self, model: str, prompt: str, **params) -> Dict:
        """Text generation"""
        url = f"{self.BASE_URL}/{model}"
        payload = {"inputs": prompt, "parameters": params}

        response = await self.client.post(url, json=payload)
        response.raise_for_status()
        return response.json()

    async def embeddings(self, model: str, text: Union[str, List[str]]) -> Dict:
        """Get text embeddings"""
        url = f"{self.BASE_URL}/{model}"
        payload = {"inputs": text}

        response = await self.client.post(url, json=payload)
        response.raise_for_status()
        return response.json()

    async def close(self):
        await self.client.aclose()


class OpenAIClient:
    """OpenAI API client"""
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = httpx.AsyncClient(
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            timeout=120.0
        )

    async def chat(self, model: str, messages: List[Dict], temperature: float = 0.7, max_tokens: int = 2000) -> Dict:
        """Chat completion"""
        url = "https://api.openai.com/v1/chat/completions"
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        response = await self.client.post(url, json=payload)
        response.raise_for_status()
        return response.json()

    async def embeddings(self, model: str, input_text: Union[str, List[str]]) -> Dict:
        """Get embeddings"""
        url = "https://api.openai.com/v1/embeddings"
        payload = {"model": model, "input": input_text}

        response = await self.client.post(url, json=payload)
        response.raise_for_status()
        return response.json()

    async def close(self):
        await self.client.aclose()


class AnthropicClient:
    """Anthropic API client for Claude"""
    BASE_URL = "https://api.anthropic.com/v1"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = httpx.AsyncClient(
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json"
            },
            timeout=120.0
        )

    async def chat(self, model: str, messages: List[Dict], max_tokens: int = 2000) -> Dict:
        """Claude chat completion"""
        url = f"{self.BASE_URL}/messages"

        # Convert messages to Anthropic format
        system_message = ""
        anthropic_messages = []
        for msg in messages:
            if msg.get("role") == "system":
                system_message = msg.get("content", "")
            else:
                anthropic_messages.append(msg)

        payload = {
            "model": model,
            "messages": anthropic_messages,
            "max_tokens": max_tokens
        }
        if system_message:
            payload["system"] = system_message

        response = await self.client.post(url, json=payload)
        response.raise_for_status()
        return response.json()

    async def close(self):
        await self.client.aclose()


# ============================================================================
# LLM Factory
# ============================================================================

def get_llm_client(model: str) -> Optional[Union[OpenRouterClient, OpenAIClient, AnthropicClient, HuggingFaceClient]]:
    """Get appropriate LLM client based on model"""
    if not settings.openrouter_api_key and not settings.openai_api_key and not settings.anthropic_api_key:
        logger.warning("No LLM API keys configured")
        return None

    # OpenRouter models (free tier available)
    if model.startswith("meta-llama") or model.startswith("mistral") or \
       model.startswith("qwen") or model.startswith("google/") or \
       model.startswith("anthropic/claude"):
        if settings.openrouter_api_key:
            return OpenRouterClient(settings.openrouter_api_key)
        elif settings.openai_api_key and model.startswith("gpt-"):
            return OpenAIClient(settings.openai_api_key)

    # OpenAI models
    if model.startswith("gpt-"):
        if settings.openai_api_key:
            return OpenAIClient(settings.openai_api_key)

    # Anthropic models
    if model.startswith("claude"):
        if settings.anthropic_api_key:
            return AnthropicClient(settings.anthropic_api_key)

    # HuggingFace models
    if model.startswith("sentence-transformers") or model.startswith("microsoft/") or \
       model.startswith("facebook/") or model.startswith("bigscience/"):
        if settings.huggingface_token:
            return HuggingFaceClient(settings.huggingface_token)

    # Default to OpenRouter if available
    if settings.openrouter_api_key:
        return OpenRouterClient(settings.openrouter_api_key)

    return None


# ============================================================================
# Lifespan Events
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    logger.info("edgeforce-ai-worker-starting",
                 app=settings.app_name,
                 debug=settings.debug,
                 providers={
                     "openai": bool(settings.openai_api_key),
                     "anthropic": bool(settings.anthropic_api_key),
                     "huggingface": bool(settings.huggingface_token),
                     "openrouter": bool(settings.openrouter_api_key)
                 })

    yield

    logger.info("edgeforce-ai-worker-shutting-down")


# ============================================================================
# FastAPI App
# ============================================================================

app = FastAPI(
    title=settings.app_name,
    description="AI Worker for EdgeForce CRM - Email processing, Agents, Tasks",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "EdgeForce AI Worker",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "providers": {
            "openai": bool(settings.openai_api_key),
            "anthropic": bool(settings.anthropic_api_key),
            "huggingface": bool(settings.huggingface_token),
            "openrouter": bool(settings.openrouter_api_key)
        }
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "EdgeForce AI Worker API",
        "docs": "/docs",
        "health": "/health"
    }


# ============================================================================
# Request Models
# ============================================================================

class ChatRequest(BaseModel):
    """Chat completion request"""
    model: str = Field(default="meta-llama/llama-3.1-8b-instruct")
    messages: List[Dict[str, str]]
    temperature: float = Field(default=0.7, ge=0, le=2)
    max_tokens: int = Field(default=2000, le=4000)
    stream: bool = False


class EmbeddingsRequest(BaseModel):
    """Embeddings request"""
    model: str = Field(default="sentence-transformers/all-MiniLM-L6-v2")
    input: Union[str, List[str]]


class AgentExecuteRequest(BaseModel):
    """Request to execute an agent task"""
    task: str = Field(..., description="The task to execute")
    context: Optional[dict] = Field(default=None, description="Additional context")
    agent_type: str = Field(default="orchestrator", description="Type of agent to use")
    model: Optional[str] = Field(default=None, description="LLM model to use")


class EmailProcessRequest(BaseModel):
    """Request to process an email"""
    from_email: str
    to_email: str
    subject: str
    body: str
    tenant_id: str
    user_id: str


class LeadScoreRequest(BaseModel):
    """Request to score a lead"""
    contact_data: dict
    tenant_id: str


class EmailGenerateRequest(BaseModel):
    """Request to generate an email"""
    email_type: str = Field(..., description="Type: follow-up, cold-outreach, welcome, closing")
    contact_name: str
    context: Optional[dict] = None
    model: Optional[str] = None


# ============================================================================
# Agent API Endpoints
# ============================================================================

@app.post("/api/agents/execute")
async def execute_agent(request: AgentExecuteRequest):
    """
    Execute a task using the Super Orchestrator Agent
    """
    logger.info("agent-execution-started",
                task=request.task,
                agent_type=request.agent_type)

    # Use the specified model or default to free model
    model = request.model or "meta-llama/llama-3.1-8b-instruct"

    # Build context into prompt
    context_str = ""
    if request.context:
        context_str = f"\n\nContext: {json.dumps(request.context)}"

    prompt = f"""You are the EdgeForce CRM Super Orchestrator Agent. Your role is to help users manage their CRM tasks efficiently.

Task: {request.task}{context_str}

Provide a helpful, actionable response. If this requires executing CRM operations, describe what actions would be taken."""

    client = get_llm_client(model)
    if not client:
        raise HTTPException(status_code=503, detail="No LLM provider configured")

    try:
        result = await client.chat(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=2000
        )

        content = ""
        if "choices" in result:
            content = result["choices"][0]["message"]["content"]
        elif "content" in result:
            content = result["content"]
        elif isinstance(result, list):
            content = result[0].get("generated_text", "")

        return {
            "task_id": f"task-{datetime.utcnow().timestamp()}",
            "status": "completed",
            "result": content,
            "model_used": model
        }
    except Exception as e:
        logger.error("agent-execution-failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Agent execution failed: {str(e)}")
    finally:
        if client:
            await client.close()


@app.get("/api/agents/status/{task_id}")
async def get_agent_status(task_id: str):
    """Get status of an agent task"""
    # In production, would check Redis/database for task status
    return {
        "task_id": task_id,
        "status": "completed",
        "result": "Task completed successfully"
    }


@app.post("/api/agents/feedback")
async def submit_feedback(
    task_id: str,
    rating: int,
    feedback: str,
    improvements: Optional[list] = None
):
    """Submit feedback for agent self-improvement"""
    logger.info("agent-feedback-received",
                task_id=task_id,
                rating=rating,
                feedback=feedback)

    # In production, store feedback in database for analysis
    return {"success": True, "message": "Feedback recorded for self-improvement"}


@app.get("/api/agents/metrics")
async def get_agent_metrics():
    """Get agent performance metrics"""
    return {
        "total_tasks": 0,
        "success_rate": 0.0,
        "avg_response_time_ms": 0,
        "models_used": {},
        "self_improvements": 0,
        "note": "Metrics will be tracked as tasks are executed"
    }


@app.post("/api/agents/improve")
async def trigger_self_improvement():
    """Trigger agent self-improvement cycle"""
    logger.info("self-improvement-triggered")

    return {
        "success": True,
        "message": "Self-improvement cycle initiated",
        "improvements_applied": 0
    }


# ============================================================================
# LLM Integration Endpoints
# ============================================================================

@app.post("/api/llm/chat")
async def chat_completion(request: ChatRequest):
    """Chat completion with multiple providers"""
    logger.info("chat-completion-request", model=request.model)

    client = get_llm_client(request.model)
    if not client:
        raise HTTPException(status_code=503, detail="No LLM provider configured for this model")

    try:
        if isinstance(client, HuggingFaceClient):
            # HuggingFace uses different API
            prompt = "\n".join([f"{msg['role']}: {msg['content']}" for msg in request.messages])
            result = await client.generate(
                model=request.model,
                prompt=prompt,
                temperature=request.temperature,
                max_new_tokens=request.max_tokens
            )
            if isinstance(result, list):
                content = result[0].get("generated_text", "")
            else:
                content = result.get("generated_text", "")

            return {
                "model": request.model,
                "content": content,
                "usage": {
                    "prompt_tokens": len(prompt) // 4,
                    "completion_tokens": len(content) // 4,
                    "total_tokens": (len(prompt) + len(content)) // 4
                }
            }
        elif isinstance(client, AnthropicClient):
            result = await client.chat(
                model=request.model,
                messages=request.messages,
                max_tokens=request.max_tokens
            )
            content = result["content"][0]["text"]
            return {
                "model": request.model,
                "content": content,
                "usage": result.get("usage", {})
            }
        else:
            # OpenAI or OpenRouter
            result = await client.chat(
                model=request.model,
                messages=request.messages,
                temperature=request.temperature,
                max_tokens=request.max_tokens
            )
            return {
                "model": result.get("model", request.model),
                "content": result["choices"][0]["message"]["content"],
                "usage": result.get("usage", {})
            }
    except Exception as e:
        logger.error("llm-chat-error", error=str(e), model=request.model)
        raise HTTPException(status_code=500, detail=f"LLM request failed: {str(e)}")
    finally:
        if client:
            await client.close()


@app.post("/api/llm/chat/stream")
async def chat_completion_stream(request: ChatRequest):
    """Streaming chat completion"""
    if not request.stream:
        return await chat_completion(request)

    logger.info("chat-completion-stream", model=request.model)

    client = get_llm_client(request.model)
    if not client:
        raise HTTPException(status_code=503, detail="No LLM provider configured")

    async def generate():
        try:
            if isinstance(client, OpenRouterClient):
                async for chunk in client.chat_stream(
                    model=request.model,
                    messages=request.messages,
                    temperature=request.temperature,
                    max_tokens=request.max_tokens
                ):
                    yield chunk
            else:
                # Fallback to non-streaming
                result = await client.chat(
                    model=request.model,
                    messages=request.messages,
                    temperature=request.temperature,
                    max_tokens=request.max_tokens
                )
                content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                yield f'data: {json.dumps({"content": content})}\n\n'
        except Exception as e:
            yield f'data: {json.dumps({"error": str(e)})}\n\n'
        finally:
            yield "data: [DONE]\n\n"
            if client:
                await client.close()

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.post("/api/llm/embeddings")
async def get_embeddings(request: EmbeddingsRequest):
    """Get text embeddings"""
    logger.info("embeddings-request", model=request.model)

    client = get_llm_client(request.model)
    if not client:
        # Try HuggingFace specifically
        if settings.huggingface_token:
            client = HuggingFaceClient(settings.huggingface_token)
        else:
            raise HTTPException(status_code=503, detail="No embeddings provider configured")

    try:
        if isinstance(client, OpenAIClient):
            result = await client.embeddings(
                model="text-embedding-3-small",
                input_text=request.input
            )
            return {
                "model": "text-embedding-3-small",
                "embeddings": [item["embedding"] for item in result["data"]],
                "usage": result.get("usage", {})
            }
        elif isinstance(client, HuggingFaceClient):
            result = await client.embeddings(request.model, request.input)
            if isinstance(result, list):
                embeddings = [item.get("embedding", []) for item in result]
            else:
                embeddings = [result.get("embedding", [])]

            return {
                "model": request.model,
                "embeddings": embeddings,
                "usage": {"prompt_tokens": sum(len(str(x)) for x in (request.input if isinstance(request.input, list) else [request.input])) // 4}
            }
        else:
            raise HTTPException(status_code=400, detail="Embeddings not supported for this provider")
    except Exception as e:
        logger.error("embeddings-error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")
    finally:
        if client:
            await client.close()


@app.get("/api/llm/models")
async def list_models(provider: str = "all"):
    """List available LLM models"""
    models = {
        "openrouter": {
            "free_models": [
                {"id": "meta-llama/llama-3.1-8b-instruct", "name": "Llama 3.1 8B", "context": 128000},
                {"id": "meta-llama/llama-3.1-70b-instruct", "name": "Llama 3.1 70B", "context": 128000},
                {"id": "mistralai/mistral-7b-instruct", "name": "Mistral 7B", "context": 32768},
                {"id": "qwen/qwen-2-7b-instruct", "name": "Qwen 2 7B", "context": 32768},
                {"id": "google/gemma-2-9b-it", "name": "Gemma 2 9B", "context": 8192},
                {"id": "anthropic/claude-3-haiku", "name": "Claude 3 Haiku", "context": 200000}
            ],
            "premium": [
                {"id": "openai/gpt-4o", "name": "GPT-4o", "context": 128000},
                {"id": "anthropic/claude-3.5-sonnet", "name": "Claude 3.5 Sonnet", "context": 200000}
            ]
        },
        "huggingface": {
            "free_models": [
                {"id": "meta-llama/Llama-2-7b-chat-hf", "name": "Llama 2 7B Chat"},
                {"id": "mistralai/Mistral-7B-v0.1", "name": "Mistral 7B"},
                {"id": "bigscience/bloom-560m", "name": "BLOOM 560M"},
                {"id": "EleutherAI/gpt-neo-2.7B", "name": "GPT-Neo 2.7B"}
            ],
            "embeddings": [
                {"id": "sentence-transformers/all-MiniLM-L6-v2", "name": "MiniLM L6"},
                {"id": "sentence-transformers/all-mpnet-base-v2", "name": "MPNet Base"}
            ]
        },
        "openai": {
            "models": [
                {"id": "gpt-4o", "name": "GPT-4o"},
                {"id": "gpt-4o-mini", "name": "GPT-4o Mini"},
                {"id": "gpt-4-turbo", "name": "GPT-4 Turbo"},
                {"id": "gpt-3.5-turbo", "name": "GPT-3.5 Turbo"}
            ],
            "embeddings": [
                {"id": "text-embedding-3-small", "name": "Embedding 3 Small"},
                {"id": "text-embedding-3-large", "name": "Embedding 3 Large"},
                {"id": "text-embedding-ada-002", "name": "Ada v2"}
            ]
        },
        "anthropic": {
            "models": [
                {"id": "claude-3-5-sonnet-20241022", "name": "Claude 3.5 Sonnet"},
                {"id": "claude-3-opus-20240229", "name": "Claude 3 Opus"},
                {"id": "claude-3-haiku-20240307", "name": "Claude 3 Haiku"}
            ]
        }
    }

    if provider != "all":
        return {provider: models.get(provider, {})}

    return models


# ============================================================================
# Email Processing Endpoints
# ============================================================================

@app.post("/api/email/process")
async def process_email(request: EmailProcessRequest):
    """Process incoming email with AI"""
    logger.info("email-processing-started",
                tenant=request.tenant_id,
                from_email=request.from_email)

    # Use LLM to classify and extract
    model = "meta-llama/llama-3.1-8b-instruct"
    client = get_llm_client(model)

    if not client:
        return {
            "email_id": f"email-{datetime.utcnow().timestamp()}",
            "intent": "unknown",
            "entities": {},
            "response_generated": False,
            "error": "AI not configured"
        }

    try:
        prompt = f"""Analyze this email and extract:
1. Intent (follow-up, inquiry, complaint, request, meeting, etc.)
2. Entities (names, companies, dates, products, etc.)
3. Suggested response

Email:
From: {request.from_email}
To: {request.to_email}
Subject: {request.subject}
Body: {request.body}

Respond in JSON format:
{{"intent": "...", "entities": {{...}}, "suggested_response": "..."}}"""

        result = await client.chat(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=500
        )

        content = ""
        if "choices" in result:
            content = result["choices"][0]["message"]["content"]
        elif "content" in result:
            content = result["content"]

        # Try to parse JSON from response
        try:
            import re
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group())
                return {
                    "email_id": f"email-{datetime.utcnow().timestamp()}",
                    "intent": parsed.get("intent", "unknown"),
                    "entities": parsed.get("entities", {}),
                    "response_generated": True,
                    "suggested_response": parsed.get("suggested_response", "")
                }
        except:
            pass

        return {
            "email_id": f"email-{datetime.utcnow().timestamp()}",
            "intent": "unknown",
            "entities": {},
            "response_generated": False,
            "raw_analysis": content[:500]
        }
    except Exception as e:
        logger.error("email-processing-error", error=str(e))
        return {
            "email_id": f"email-{datetime.utcnow().timestamp()}",
            "intent": "unknown",
            "entities": {},
            "response_generated": False,
            "error": str(e)
        }
    finally:
        if client:
            await client.close()


@app.post("/api/email/generate")
async def generate_email(request: EmailGenerateRequest):
    """Generate AI-powered email"""
    logger.info("email-generation-started",
                email_type=request.email_type,
                contact=request.contact_name)

    model = request.model or "meta-llama/llama-3.1-8b-instruct"
    client = get_llm_client(model)

    if not client:
        raise HTTPException(status_code=503, detail="AI not configured")

    try:
        context_str = ""
        if request.context:
            context_str = f"\n\nContext: {json.dumps(request.context)}"

        prompt = f"""Generate a professional {request.email_type} email for a CRM.

Contact Name: {request.contact_name}
{context_str}

Write a complete, professional email with subject line and body.
Make it personalized and action-oriented."""

        result = await client.chat(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1000
        )

        content = ""
        if "choices" in result:
            content = result["choices"][0]["message"]["content"]
        elif "content" in result:
            content = result["content"]

        # Try to parse subject and body
        lines = content.split('\n')
        subject = f"Re: {request.email_type.title()}"
        body = content

        for i, line in enumerate(lines):
            if line.lower().startswith("subject:"):
                subject = line[8:].strip()
                body = '\n'.join(lines[i+1:])
                break

        return {
            "email_type": request.email_type,
            "subject": subject,
            "body": body.strip(),
            "model_used": model
        }
    except Exception as e:
        logger.error("email-generation-error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Email generation failed: {str(e)}")
    finally:
        if client:
            await client.close()


# ============================================================================
# AI Lead Scoring
# ============================================================================

@app.post("/api/ai/score-lead")
async def score_lead(request: LeadScoreRequest):
    """Score a lead using AI"""
    logger.info("lead-scoring-started", tenant=request.tenant_id)

    model = "meta-llama/llama-3.1-8b-instruct"
    client = get_llm_client(model)

    if not client:
        # Return default score without AI
        return {
            "score": 50,
            "grade": "C",
            "factors": [],
            "recommendation": "AI not configured - manual review required"
        }

    try:
        prompt = f"""Analyze this lead and provide a score (0-100) based on conversion probability.

Lead Data: {json.dumps(request.contact_data)}

Respond in JSON format:
{{
  "score": <number 0-100>,
  "grade": "<A/B/C/D/F>",
  "factors": [
    {{"factor": "<name>", "score": <1-10>, "reason": "<why>"}}
  ],
  "recommendation": "<action to take>"
}}"""

        result = await client.chat(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=500
        )

        content = ""
        if "choices" in result:
            content = result["choices"][0]["message"]["content"]
        elif "content" in result:
            content = result["content"]

        # Try to parse JSON
        try:
            import re
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group())
                return {
                    "score": parsed.get("score", 50),
                    "grade": parsed.get("grade", "C"),
                    "factors": parsed.get("factors", []),
                    "recommendation": parsed.get("recommendation", "Manual review needed")
                }
        except:
            pass

        return {
            "score": 50,
            "grade": "C",
            "factors": [],
            "recommendation": "Unable to analyze - manual review required"
        }
    except Exception as e:
        logger.error("lead-scoring-error", error=str(e))
        return {
            "score": 50,
            "grade": "C",
            "factors": [],
            "recommendation": f"Error: {str(e)}"
        }
    finally:
        if client:
            await client.close()


# ============================================================================
# Background Tasks
# ============================================================================

async def send_email_task(to: str, subject: str, body: str):
    """Background task to send email"""
    logger.info("sending-email", to=to)
    # In production, integrate with email provider (SendGrid, AWS SES, etc.)
    await asyncio.sleep(0.1)
    logger.info("email-sent", to=to)


@app.post("/api/tasks/email")
async def queue_email(
    to: str,
    subject: str,
    body: str,
    background_tasks: BackgroundTasks
):
    """Queue an email to be sent"""
    background_tasks.add_task(send_email_task, to, subject, body)
    return {"task_id": f"email-task-{datetime.utcnow().timestamp()}"}


# ============================================================================
# WebSocket for Real-time Updates
# ============================================================================

from fastapi import WebSocket, WebSocketDisconnect

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for real-time agent updates"""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Process and respond
            await websocket.send_json({
                "type": "echo",
                "data": data,
                "timestamp": datetime.utcnow().isoformat()
            })
    except WebSocketDisconnect:
        logger.info("websocket-disconnected")


# ============================================================================
# Error Handling
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return {
        "error": exc.detail,
        "status_code": exc.status_code
    }


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error("unhandled-exception", error=str(exc))
    return {
        "error": "Internal server error",
        "status_code": 500
    }


# ============================================================================
# Run
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=settings.debug
    )
