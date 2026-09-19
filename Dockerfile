FROM python:3.10-slim

# Create a user to run the app (Hugging Face requirement for security)
RUN useradd -m -u 1000 user

# Set the working directory to the user's home
WORKDIR /home/user/app

# Copy requirements and install
COPY --chown=user backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend folder
COPY --chown=user backend/ ./backend/

# Switch to the non-root user
USER user

# Set the working directory to where the api folder is located
WORKDIR /home/user/app/backend

# Expose port 7860 (Standard for Hugging Face Spaces)
EXPOSE 7860

# Run the FastAPI server on port 7860
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "7860"]
