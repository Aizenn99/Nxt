from huggingface_hub import hf_hub_download
import os

token = os.getenv("HF_TOKEN")
repo = "kandinskylab/Kandinsky-5.0-T2I-Lite"
os.makedirs("./weights", exist_ok=True)

print(f"Downloading {repo}...")
try:
    path = hf_hub_download(
        repo_id=repo, 
        filename="model/kandinsky5lite_t2i.safetensors", 
        local_dir="./weights",
        token=token
    )
    print(f"Downloaded to {path}")
except Exception as e:
    print(f"Error: {e}")
