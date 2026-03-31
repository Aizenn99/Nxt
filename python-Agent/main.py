from fastapi import FastAPI
from pydantic import BaseModel
from vision_agents import Agent, User
from vision_agents.integrations import getstream, gemini, deepgram, elevenlabs
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

class StartAgentRequest(BaseModel):
    call_id: str
    instructions: str = "You are NxtAi, a helpful AI assistant."

@app.post("/start-agent")
async def start_agent(req: StartAgentRequest):
    agent = Agent(
        edge=getstream.Edge(),
        agent_user=User(name="NxtAi", id="nxtai-agent"),
        instructions=req.instructions,
        llm=gemini.Realtime(fps=5),
        tts=elevenlabs.TTS(),
        stt=deepgram.STT(),
    )
    await agent.join(call_id=req.call_id)
    return {"status": "started", "call_id": req.call_id}

@app.get("/health")
def health():
    return {"status": "ok"}
