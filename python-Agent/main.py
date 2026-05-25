from fastapi import FastAPI
from fastapi.responses import FileResponse
from pydantic import BaseModel
from vision_agents.core import Agent, User
from vision_agents.plugins import getstream, gemini, deepgram
from dotenv import load_dotenv
import asyncio
import sys
import os
import torch

# Add kandinsky-5 to path
sys.path.append(os.path.join(os.path.dirname(__file__), "kandinsky-5"))
from kandinsky import get_image_pipeline

load_dotenv()
app = FastAPI()

active_calls = set()

class StartAgentRequest(BaseModel):
    call_id: str
    instructions: str = "You are NxtAi, a helpful AI assistant."

class GenerateImageRequest(BaseModel):
    prompt: str
    width: int = 1024
    height: int = 1024
    seed: int = 42

# Global pipeline variable
image_pipe = None

def get_pipeline():
    global image_pipe
    if image_pipe is None:
        print("🚀 Initializing Kandinsky-5 Image Lite Pipeline...")
        device_map = {
            "dit": torch.device('cuda:0') if torch.cuda.is_available() else torch.device('cpu'),
            "vae": torch.device('cuda:0') if torch.cuda.is_available() else torch.device('cpu'),
            "text_embedder": torch.device('cuda:0') if torch.cuda.is_available() else torch.device('cpu')
        }
        # Using Lite model with offload and quantization for 4GB VRAM
        image_pipe = get_image_pipeline(
            device_map=device_map,
            mode="t2i",
            offload=True,
            quantized_qwen=True,
            attention_engine="auto", # will fallback to SDPA if flash isn't available
            cache_dir=os.path.join(os.path.dirname(__file__), "weights")
        )
    return image_pipe

@app.post("/start-agent")
async def start_agent(req: StartAgentRequest):
    if req.call_id in active_calls:
        return {"status": "ignored", "message": "Agent already running for this call", "call_id": req.call_id}
    active_calls.add(req.call_id)

    agent_user = User(name="NxtAi", id="nxtai-agent")
    edge = getstream.Edge()
    await edge.authenticate(agent_user)

    # Use gemini-2.5-flash — confirmed available via ListModels and matches the client
    # Use deepgram for BOTH STT and TTS — ElevenLabs free tier is blocked
    agent = Agent(
        edge=edge,
        agent_user=agent_user,
        instructions=req.instructions,
        llm=gemini.LLM(model="gemini-2.5-flash"),
        tts=deepgram.TTS(),
        stt=deepgram.STT(),
    )

    # Create the call object from the edge transport
    call = await edge.create_call(call_id=req.call_id)

    # agent.join() is an async context manager — run it in a background task
    async def run_agent():
        try:
            print(f"🎙️ Agent attempting to join call: {req.call_id}")
            # Small delay to let Stream signaling stabilize before joining
            await asyncio.sleep(2)

            async with agent.join(call):
                print(f"✅ Agent joined call: {req.call_id}. Active and listening...")

                # Keep the agent alive while the call is active and no errors occur
                while req.call_id in active_calls:
                    await asyncio.sleep(5)

        except asyncio.CancelledError:
            print(f"⚠️ Agent task for {req.call_id} was cancelled")
        except Exception as e:
            import traceback
            error_str = str(e)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                print("🛑 RATE LIMIT EXHAUSTED: Please wait 60s or switch to a paid Gemini key.")
            elif "signaling state" in error_str:
                print("🔌 WebRTC signaling closed. The user may have left the call.")
            elif "404" in error_str or "NOT_FOUND" in error_str:
                print(f"🚫 MODEL NOT FOUND: {error_str[:200]}")
            else:
                print(f"❌ Agent Error in {req.call_id}: {type(e).__name__}: {e}")
                traceback.print_exc()
        finally:
            active_calls.discard(req.call_id)
            print(f"🚪 Agent task cleanup for {req.call_id}")

    asyncio.create_task(run_agent())
    return {"status": "started", "call_id": req.call_id}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/generate-image")
async def generate_image(req: GenerateImageRequest):
    try:
        pipe = get_pipeline()
        
        # Ensure weights directory exists
        output_dir = os.path.join(os.path.dirname(__file__), "outputs")
        os.makedirs(output_dir, exist_ok=True)
        
        output_path = os.path.join(output_dir, f"gen_{req.seed}_{asyncio.get_event_loop().time()}.png")
        
        # Generate image (this is a blocking call, but we'll run it in a thread pool if needed)
        # For now, running directly. In production, use run_in_executor.
        print(f"🎨 Generating image for prompt: {req.prompt}")
        pipe(
            text=req.prompt,
            width=req.width,
            height=req.height,
            seed=req.seed,
            save_path=output_path
        )
        
        if os.path.exists(output_path):
            return FileResponse(output_path, media_type="image/png")
        else:
            return {"status": "error", "message": "Failed to save generated image"}
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}
