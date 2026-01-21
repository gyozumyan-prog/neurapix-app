// ComfyUI Workflow Templates for FLUX
// These workflows are in ComfyUI API format for RunPod worker-comfyui
// Uses CheckpointLoaderSimple which loads UNET, CLIP, and VAE from a single checkpoint file

export interface ComfyUIWorkflow {
  [nodeId: string]: {
    class_type: string;
    inputs: Record<string, any>;
    _meta?: { title: string };
  };
}

// Simple text-to-image workflow using CheckpointLoaderSimple
// This is the most compatible approach for flux1-dev-fp8 image
export function createTextToImageWorkflow(
  prompt: string,
  negativePrompt: string = "",
  seed: number = Math.floor(Math.random() * 1000000),
  steps: number = 20,
  cfg: number = 1.0,
  width: number = 1024,
  height: number = 1024
): ComfyUIWorkflow {
  return {
    "1": {
      class_type: "CheckpointLoaderSimple",
      inputs: {
        ckpt_name: "flux1-dev-fp8.safetensors"
      },
      _meta: { title: "Load Checkpoint" }
    },
    "2": {
      class_type: "CLIPTextEncode",
      inputs: {
        text: prompt,
        clip: ["1", 1]
      },
      _meta: { title: "Positive Prompt" }
    },
    "3": {
      class_type: "CLIPTextEncode",
      inputs: {
        text: negativePrompt,
        clip: ["1", 1]
      },
      _meta: { title: "Negative Prompt" }
    },
    "4": {
      class_type: "EmptyLatentImage",
      inputs: {
        width: width,
        height: height,
        batch_size: 1
      },
      _meta: { title: "Empty Latent" }
    },
    "5": {
      class_type: "KSampler",
      inputs: {
        model: ["1", 0],
        positive: ["2", 0],
        negative: ["3", 0],
        latent_image: ["4", 0],
        seed: seed,
        steps: steps,
        cfg: cfg,
        sampler_name: "euler",
        scheduler: "simple",
        denoise: 1.0
      },
      _meta: { title: "KSampler" }
    },
    "6": {
      class_type: "VAEDecode",
      inputs: {
        samples: ["5", 0],
        vae: ["1", 2]
      },
      _meta: { title: "VAE Decode" }
    },
    "7": {
      class_type: "SaveImage",
      inputs: {
        images: ["6", 0],
        filename_prefix: "flux_output"
      },
      _meta: { title: "Save Image" }
    }
  };
}

// Img2Img workflow for style transfer and inpainting-like effects
export function createImg2ImgWorkflow(
  prompt: string,
  negativePrompt: string = "",
  seed: number = Math.floor(Math.random() * 1000000),
  steps: number = 20,
  cfg: number = 1.0,
  denoise: number = 0.7
): ComfyUIWorkflow {
  return {
    "1": {
      class_type: "CheckpointLoaderSimple",
      inputs: {
        ckpt_name: "flux1-dev-fp8.safetensors"
      },
      _meta: { title: "Load Checkpoint" }
    },
    "2": {
      class_type: "LoadImage",
      inputs: {
        image: "input_image.png"
      },
      _meta: { title: "Load Image" }
    },
    "3": {
      class_type: "VAEEncode",
      inputs: {
        pixels: ["2", 0],
        vae: ["1", 2]
      },
      _meta: { title: "VAE Encode" }
    },
    "4": {
      class_type: "CLIPTextEncode",
      inputs: {
        text: prompt,
        clip: ["1", 1]
      },
      _meta: { title: "Positive Prompt" }
    },
    "5": {
      class_type: "CLIPTextEncode",
      inputs: {
        text: negativePrompt,
        clip: ["1", 1]
      },
      _meta: { title: "Negative Prompt" }
    },
    "6": {
      class_type: "KSampler",
      inputs: {
        model: ["1", 0],
        positive: ["4", 0],
        negative: ["5", 0],
        latent_image: ["3", 0],
        seed: seed,
        steps: steps,
        cfg: cfg,
        sampler_name: "euler",
        scheduler: "simple",
        denoise: denoise
      },
      _meta: { title: "KSampler" }
    },
    "7": {
      class_type: "VAEDecode",
      inputs: {
        samples: ["6", 0],
        vae: ["1", 2]
      },
      _meta: { title: "VAE Decode" }
    },
    "8": {
      class_type: "SaveImage",
      inputs: {
        images: ["7", 0],
        filename_prefix: "img2img_output"
      },
      _meta: { title: "Save Image" }
    }
  };
}

// Colorize workflow - converts black & white images to color using img2img
// Uses very low denoise to preserve original photo structure while adding color
export function createColorizeWorkflow(
  seed: number = Math.floor(Math.random() * 1000000),
  steps: number = 20,
  cfg: number = 1.0,
  denoise: number = 0.28
): ComfyUIWorkflow {
  return {
    "1": {
      class_type: "CheckpointLoaderSimple",
      inputs: {
        ckpt_name: "flux1-dev-fp8.safetensors"
      },
      _meta: { title: "Load Checkpoint" }
    },
    "2": {
      class_type: "LoadImage",
      inputs: {
        image: "input_image.png"
      },
      _meta: { title: "Load Image" }
    },
    "3": {
      class_type: "VAEEncode",
      inputs: {
        pixels: ["2", 0],
        vae: ["1", 2]
      },
      _meta: { title: "VAE Encode" }
    },
    "4": {
      class_type: "CLIPTextEncode",
      inputs: {
        text: "color photograph, natural colors",
        clip: ["1", 1]
      },
      _meta: { title: "Positive Prompt" }
    },
    "5": {
      class_type: "CLIPTextEncode",
      inputs: {
        text: "",
        clip: ["1", 1]
      },
      _meta: { title: "Negative Prompt" }
    },
    "6": {
      class_type: "KSampler",
      inputs: {
        model: ["1", 0],
        positive: ["4", 0],
        negative: ["5", 0],
        latent_image: ["3", 0],
        seed: seed,
        steps: steps,
        cfg: cfg,
        sampler_name: "euler",
        scheduler: "simple",
        denoise: denoise
      },
      _meta: { title: "KSampler" }
    },
    "7": {
      class_type: "VAEDecode",
      inputs: {
        samples: ["6", 0],
        vae: ["1", 2]
      },
      _meta: { title: "VAE Decode" }
    },
    "8": {
      class_type: "SaveImage",
      inputs: {
        images: ["7", 0],
        filename_prefix: "colorized_output"
      },
      _meta: { title: "Save Image" }
    }
  };
}

// Inpainting workflow - uses separate image and mask, composites result onto original
export function createInpaintingWorkflow(
  prompt: string,
  negativePrompt: string = "",
  seed: number = Math.floor(Math.random() * 1000000),
  steps: number = 20,
  cfg: number = 1.0,
  denoise: number = 1.0,
  width: number = 1024,
  height: number = 1024
): ComfyUIWorkflow {
  return {
    "1": {
      class_type: "CheckpointLoaderSimple",
      inputs: {
        ckpt_name: "flux1-dev-fp8.safetensors"
      },
      _meta: { title: "Load Checkpoint" }
    },
    "2": {
      class_type: "LoadImage",
      inputs: {
        image: "input_image.png"
      },
      _meta: { title: "Load Original Image" }
    },
    "3": {
      class_type: "LoadImage",
      inputs: {
        image: "input_mask.png"
      },
      _meta: { title: "Load Mask" }
    },
    "4": {
      class_type: "ImageToMask",
      inputs: {
        image: ["3", 0],
        channel: "red"
      },
      _meta: { title: "Convert to Mask" }
    },
    "5": {
      class_type: "VAEEncode",
      inputs: {
        pixels: ["2", 0],
        vae: ["1", 2]
      },
      _meta: { title: "VAE Encode" }
    },
    "6": {
      class_type: "SetLatentNoiseMask",
      inputs: {
        samples: ["5", 0],
        mask: ["4", 0]
      },
      _meta: { title: "Set Latent Noise Mask" }
    },
    "7": {
      class_type: "CLIPTextEncode",
      inputs: {
        text: prompt,
        clip: ["1", 1]
      },
      _meta: { title: "Positive Prompt" }
    },
    "8": {
      class_type: "CLIPTextEncode",
      inputs: {
        text: negativePrompt,
        clip: ["1", 1]
      },
      _meta: { title: "Negative Prompt" }
    },
    "9": {
      class_type: "KSampler",
      inputs: {
        model: ["1", 0],
        positive: ["7", 0],
        negative: ["8", 0],
        latent_image: ["6", 0],
        seed: seed,
        steps: steps,
        cfg: cfg,
        sampler_name: "euler",
        scheduler: "simple",
        denoise: denoise
      },
      _meta: { title: "KSampler" }
    },
    "10": {
      class_type: "VAEDecode",
      inputs: {
        samples: ["9", 0],
        vae: ["1", 2]
      },
      _meta: { title: "VAE Decode" }
    },
    "11": {
      class_type: "ImageCompositeMasked",
      inputs: {
        destination: ["2", 0],
        source: ["10", 0],
        mask: ["4", 0],
        x: 0,
        y: 0,
        resize_source: true
      },
      _meta: { title: "Composite onto Original" }
    },
    "12": {
      class_type: "SaveImage",
      inputs: {
        images: ["11", 0],
        filename_prefix: "inpaint_output"
      },
      _meta: { title: "Save Image" }
    }
  };
}
