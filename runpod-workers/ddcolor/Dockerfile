# DDColor RunPod Serverless Worker
# Based on RunPod PyTorch base image with CUDA support

FROM runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel-ubuntu22.04

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    wget \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the DDColor model to bake it into the image (faster cold starts)
RUN python -c "from modelscope.pipelines import pipeline; from modelscope.utils.constant import Tasks; pipeline(Tasks.image_colorization, model='damo/cv_ddcolor_image-colorization')" || true

# Copy handler
COPY rp_handler.py .

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Run the handler
CMD ["python", "-u", "rp_handler.py"]
