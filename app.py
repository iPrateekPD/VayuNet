import uvicorn
from backend.api.main import app

if __name__ == "__main__":
    # Hugging Face Spaces expects the server to run on port 7860
    uvicorn.run(app, host="0.0.0.0", port=7860)
