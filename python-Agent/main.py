from fastapi import FastAPI
from pydantic import BaseModel
from vision_agents.core import Agent, User
from vision_agents.plugins import getstream, gemini, deepgram, elevenlabs
from dotenv import load_dotenv
import asyncio

load_dotenv()
app = FastAPI()

class StartAgentRequest(BaseModel):
    call_id: str
    instructions: str = "You are NxtAi, a helpful AI assistant."

@app.post("/start-agent")
async def start_agent(req: StartAgentRequest):
    agent_user = User(name="NxtAi", id="nxtai-agent")
    edge = getstream.Edge()
    await edge.authenticate(agent_user)

    agent = Agent(
        edge=edge,
        agent_user=agent_user,
        instructions=req.instructions,
        llm=gemini.Realtime(fps=5),
        tts=elevenlabs.TTS(),
        stt=deepgram.STT(),
    )

    # Create the call object from the edge transport
    call = await edge.create_call(call_id=req.call_id)

    # agent.join() is an async context manager — run it in a background task
    async def run_agent():
        async with agent.join(call):
            await agent.finish()

    asyncio.create_task(run_agent())
    return {"status": "started", "call_id": req.call_id}

@app.get("/health")
def health():
    return {"status": "ok"}
