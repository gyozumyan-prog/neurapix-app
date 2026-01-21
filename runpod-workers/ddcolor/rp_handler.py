"""
DDColor RunPod Serverless Handler
Colorizes black and white images using DDColor model
"""

import runpod
import cv2
import base64
import numpy as np
from io import BytesIO
from PIL import Image
import torch

# Global model instance
colorization_pipeline = None

def load_model():
    """Load DDColor model from ModelScope"""
    global colorization_pipeline
    if colorization_pipeline is None:
        print("Loading DDColor model...")
        from modelscope.pipelines import pipeline
        from modelscope.utils.constant import Tasks
        
        colorization_pipeline = pipeline(
            Tasks.image_colorization,
            model='damo/cv_ddcolor_image-colorization'
        )
        print("DDColor model loaded successfully!")
    return colorization_pipeline

def decode_image(image_input):
    """Decode base64 image or download from URL"""
    if image_input.startswith('http'):
        import requests
        response = requests.get(image_input)
        image_data = response.content
    else:
        # Remove data URI prefix if present
        if ',' in image_input:
            image_input = image_input.split(',')[1]
        image_data = base64.b64decode(image_input)
    
    # Convert to numpy array
    nparr = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img

def encode_image(img):
    """Encode image to base64 PNG"""
    _, buffer = cv2.imencode('.png', img)
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    return img_base64

def handler(job):
    """
    RunPod handler for DDColor colorization
    
    Input:
    {
        "input": {
            "image": "base64_encoded_image_or_url"
        }
    }
    
    Output:
    {
        "image": "base64_encoded_colorized_image"
    }
    """
    try:
        job_input = job.get('input', {})
        image_input = job_input.get('image')
        
        if not image_input:
            return {"error": "No image provided"}
        
        # Load model
        model = load_model()
        
        # Decode input image
        print("Decoding input image...")
        input_img = decode_image(image_input)
        
        # Save to temp file for ModelScope pipeline
        temp_path = "/tmp/input_image.png"
        cv2.imwrite(temp_path, input_img)
        
        # Run colorization
        print("Running DDColor colorization...")
        from modelscope.outputs import OutputKeys
        result = model(temp_path)
        
        # Get output image
        output_img = result[OutputKeys.OUTPUT_IMG]
        
        # Encode result
        print("Encoding output...")
        output_base64 = encode_image(output_img)
        
        return {
            "image": output_base64,
            "status": "success"
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

# Start the serverless worker
runpod.serverless.start({"handler": handler})
