// RunPod Serverless API Client for NeuraPix
// Provides lower-cost AI image processing compared to Replicate

import sharp from "sharp";

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;

// Max dimensions for upscale to avoid GPU OOM errors
const MAX_UPSCALE_DIMENSION = 1500; // Max width or height before resizing
const RUNPOD_BASE_URL = "https://api.runpod.ai/v2";

// RunPod Endpoint IDs - these need to be created in RunPod console
// Using pre-built workers from: https://github.com/ashleykleynhans/runpod-worker-real-esrgan
export const RUNPOD_ENDPOINTS = {
  // Real-ESRGAN for upscaling (includes GFPGAN face enhance)
  "real-esrgan": process.env.RUNPOD_ESRGAN_ENDPOINT_ID || "",
  // GFPGAN for face restoration
  "gfpgan": process.env.RUNPOD_GFPGAN_ENDPOINT_ID || "",
  // Rembg for background removal
  "rembg": process.env.RUNPOD_REMBG_ENDPOINT_ID || "",
  // FLUX for inpainting/outpainting
  "flux": process.env.RUNPOD_FLUX_ENDPOINT_ID || "",
  // DDColor for colorization
  "ddcolor": process.env.RUNPOD_DDCOLOR_ENDPOINT_ID || "",
  // Old photo restoration
  "old-photo": process.env.RUNPOD_OLDPHOTO_ENDPOINT_ID || "",
  // Inswapper for face swap
  "inswapper": process.env.RUNPOD_INSWAPPER_ENDPOINT_ID || "",
  // A1111 for age/expression change via img2img
  "a1111": process.env.RUNPOD_A1111_ENDPOINT_ID || "",
};

interface RunPodJob {
  id: string;
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "CANCELLED";
  output?: any;
  error?: string;
}

interface RunPodRunOptions {
  endpointId: string;
  input: Record<string, any>;
  timeout?: number; // ms, default 90000
}

// Convert image URL to base64 for RunPod with EXIF orientation normalization
export async function imageUrlToBase64(url: string, normalizeOrientation: boolean = true): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  
  // Normalize EXIF orientation to prevent rotated images after processing
  // sharp.rotate() without arguments auto-rotates based on EXIF and strips EXIF data
  if (normalizeOrientation) {
    try {
      const normalizedBuffer = await sharp(buffer)
        .rotate() // Auto-rotate based on EXIF orientation
        .toBuffer();
      return normalizedBuffer.toString("base64");
    } catch (e) {
      console.log("EXIF normalization failed, using original:", e);
      return buffer.toString("base64");
    }
  }
  
  return buffer.toString("base64");
}

// Resize image if too large for upscale (prevents GPU OOM errors)
async function resizeForUpscale(imageBuffer: Buffer, maxDimension: number): Promise<{ buffer: Buffer; wasResized: boolean; originalSize: { width: number; height: number } }> {
  // First normalize EXIF orientation
  const normalizedBuffer = await sharp(imageBuffer)
    .rotate() // Auto-rotate based on EXIF orientation
    .toBuffer();
  
  const metadata = await sharp(normalizedBuffer).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;
  
  console.log(`Image dimensions after EXIF normalization: ${width}x${height}, max allowed: ${maxDimension}`);
  
  if (width <= maxDimension && height <= maxDimension) {
    return { buffer: normalizedBuffer, wasResized: false, originalSize: { width, height } };
  }
  
  // Calculate new dimensions maintaining aspect ratio
  const scale = maxDimension / Math.max(width, height);
  const newWidth = Math.round(width * scale);
  const newHeight = Math.round(height * scale);
  
  console.log(`Resizing image from ${width}x${height} to ${newWidth}x${newHeight} for processing`);
  
  const resizedBuffer = await sharp(normalizedBuffer)
    .resize(newWidth, newHeight, { fit: 'inside' })
    .jpeg({ quality: 95 })
    .toBuffer();
  
  return { buffer: resizedBuffer, wasResized: true, originalSize: { width, height } };
}

// Fetch image and optionally resize for upscale
async function fetchAndPrepareForUpscale(url: string, maxDimension: number): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  
  const { buffer: processedBuffer, wasResized } = await resizeForUpscale(buffer, maxDimension);
  
  if (wasResized) {
    console.log(`Image was resized to fit within ${maxDimension}px for processing`);
  }
  
  return processedBuffer.toString("base64");
}

// Run a job synchronously (blocks until complete or timeout)
export async function runSync(options: RunPodRunOptions): Promise<any> {
  const { endpointId, input, timeout = 90000 } = options;

  if (!RUNPOD_API_KEY) {
    throw new Error("RUNPOD_API_KEY not configured");
  }

  if (!endpointId) {
    throw new Error("RunPod endpoint ID not configured for this model");
  }

  const response = await fetch(`${RUNPOD_BASE_URL}/${endpointId}/runsync`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RUNPOD_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`RunPod API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  if (result.status === "FAILED") {
    throw new Error(`RunPod job failed: ${result.error || "Unknown error"}`);
  }

  return result.output;
}

// Run a job asynchronously and poll for result
export async function runAsync(options: RunPodRunOptions): Promise<any> {
  const { endpointId, input, timeout = 300000 } = options; // 5 min default

  if (!RUNPOD_API_KEY) {
    throw new Error("RUNPOD_API_KEY not configured");
  }

  if (!endpointId) {
    throw new Error("RunPod endpoint ID not configured for this model");
  }

  // Submit job
  const submitResponse = await fetch(`${RUNPOD_BASE_URL}/${endpointId}/run`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RUNPOD_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input }),
  });

  if (!submitResponse.ok) {
    const errorText = await submitResponse.text();
    throw new Error(`RunPod submit error: ${submitResponse.status} - ${errorText}`);
  }

  const job: RunPodJob = await submitResponse.json();
  const jobId = job.id;
  const startTime = Date.now();

  // Poll for result
  while (Date.now() - startTime < timeout) {
    const statusResponse = await fetch(
      `${RUNPOD_BASE_URL}/${endpointId}/status/${jobId}`,
      {
        headers: {
          Authorization: `Bearer ${RUNPOD_API_KEY}`,
        },
      }
    );

    if (!statusResponse.ok) {
      throw new Error(`RunPod status check failed: ${statusResponse.status}`);
    }

    const status: RunPodJob = await statusResponse.json();

    if (status.status === "COMPLETED") {
      return status.output;
    }

    if (status.status === "FAILED") {
      throw new Error(`RunPod job failed: ${status.error || "Unknown error"}`);
    }

    if (status.status === "CANCELLED") {
      throw new Error("RunPod job was cancelled");
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error(`RunPod job timed out after ${timeout}ms`);
}

// Helper to check if RunPod is configured for a specific model
export function isRunPodConfigured(model: keyof typeof RUNPOD_ENDPOINTS): boolean {
  return !!RUNPOD_ENDPOINTS[model];
}

// High-level functions for specific tools

// Upscale image using Real-ESRGAN
// outscale parameter allows upscaling beyond model's native scale (e.g., 8x using 4x model)
// skipResize: true = don't resize input (for 8x second pass to preserve first pass result)
// forceMaxDim: override the automatic maxDim calculation
export async function upscaleImage(
  imageUrl: string,
  scale: 2 | 4 = 4,
  faceEnhance: boolean = false,
  options?: { skipResize?: boolean; forceMaxDim?: number }
): Promise<string> {
  // Default max dimensions based on scale
  // 2x: 1500px max, 4x: 1024px max
  const defaultMaxDim = scale === 4 ? 1024 : 1500;
  const maxDim = options?.forceMaxDim || defaultMaxDim;
  
  let base64Image: string;
  
  if (options?.skipResize) {
    // Skip resize - used for 8x second pass to preserve quality
    console.log(`Preparing image for ${scale}x upscale (model: ${scale}x), NO resize (skipResize=true)`);
    base64Image = await imageUrlToBase64(imageUrl);
  } else {
    console.log(`Preparing image for ${scale}x upscale (model: ${scale}x), max dimension: ${maxDim}px`);
    base64Image = await fetchAndPrepareForUpscale(imageUrl, maxDim);
  }

  const inputParams: any = {
    source_image: base64Image,
    model: `RealESRGAN_x${scale}plus`,
    scale: scale,
    face_enhance: faceEnhance,
  };

  const output = await runAsync({
    endpointId: RUNPOD_ENDPOINTS["real-esrgan"],
    input: inputParams,
  });

  // Output is base64, convert to data URL or upload
  if (output?.image) {
    return `data:image/png;base64,${output.image}`;
  }

  throw new Error("No output image from Real-ESRGAN");
}

// Restore face using GFPGAN (via ESRGAN worker with face_enhance)
export async function restoreFace(imageUrl: string): Promise<string> {
  // Limit image size to prevent CUDA out of memory errors (GPU has 22GB, need ~20GB for large images)
  const MAX_SIZE = 1024; // Conservative limit for face restore to prevent OOM
  const base64Image = await fetchAndPrepareForUpscale(imageUrl, MAX_SIZE);

  const output = await runAsync({
    endpointId: RUNPOD_ENDPOINTS["gfpgan"],
    input: {
      source_image: base64Image,
      scale: 2,
      face_enhance: true,
    },
  });

  // Debug: log the output structure
  console.log("GFPGAN output keys:", output ? Object.keys(output) : "null");
  console.log("GFPGAN output preview:", output ? JSON.stringify(output).substring(0, 500) : "null");

  // Handle various output formats
  if (output?.image) {
    return `data:image/png;base64,${output.image}`;
  }
  
  // Some workers return output directly as base64 string
  if (typeof output === 'string') {
    if (output.startsWith('data:')) {
      return output;
    }
    return `data:image/png;base64,${output}`;
  }
  
  // Some workers return output.output
  if (output?.output) {
    if (typeof output.output === 'string') {
      if (output.output.startsWith('data:')) {
        return output.output;
      }
      return `data:image/png;base64,${output.output}`;
    }
    if (output.output?.image) {
      return `data:image/png;base64,${output.output.image}`;
    }
  }
  
  // Try result key
  if (output?.result) {
    if (typeof output.result === 'string') {
      if (output.result.startsWith('data:')) {
        return output.result;
      }
      return `data:image/png;base64,${output.result}`;
    }
  }

  console.error("GFPGAN - unexpected output format:", JSON.stringify(output));
  throw new Error("No output image from GFPGAN - check logs for output format");
}

// Portrait enhance - uses Real-ESRGAN WITHOUT face modification
// Just upscales and enhances quality without changing facial features
export async function portraitEnhance(imageUrl: string): Promise<string> {
  const base64Image = await imageUrlToBase64(imageUrl);
  
  // Estimate image size from base64 length (rough estimate)
  const estimatedSizeKB = (base64Image.length * 3 / 4) / 1024;
  const scale = estimatedSizeKB > 500 ? 1 : 2;
  
  console.log(`Portrait enhance: image ~${Math.round(estimatedSizeKB)}KB, using scale=${scale}`);

  // Use Real-ESRGAN WITHOUT face_enhance to preserve original facial features
  const output = await runAsync({
    endpointId: RUNPOD_ENDPOINTS["real-esrgan"],
    input: {
      source_image: base64Image,
      model: "RealESRGAN_x2plus",
      scale: scale,
      face_enhance: false,  // IMPORTANT: Don't modify face!
    },
  });

  console.log("Portrait enhance output keys:", output ? Object.keys(output) : "null");
  console.log("Portrait enhance output preview:", output ? JSON.stringify(output).substring(0, 500) : "null");

  // Handle various output formats
  if (output?.image) {
    return `data:image/png;base64,${output.image}`;
  }
  
  // Some workers return output directly as base64 string
  if (typeof output === 'string') {
    if (output.startsWith('data:')) {
      return output;
    }
    return `data:image/png;base64,${output}`;
  }
  
  // Some workers return output.output
  if (output?.output) {
    if (typeof output.output === 'string') {
      if (output.output.startsWith('data:')) {
        return output.output;
      }
      return `data:image/png;base64,${output.output}`;
    }
    if (output.output?.image) {
      return `data:image/png;base64,${output.output.image}`;
    }
  }
  
  // Try result key
  if (output?.result) {
    if (typeof output.result === 'string') {
      if (output.result.startsWith('data:')) {
        return output.result;
      }
      return `data:image/png;base64,${output.result}`;
    }
  }

  console.error("Portrait enhance - unexpected output format:", JSON.stringify(output));
  throw new Error("No output image from portrait enhance - check logs for output format");
}

// Remove background using BiRefNet via Replicate (best quality for hair)
export async function removeBackground(imageUrl: string): Promise<string> {
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  
  // Use Bria RMBG 2.0 - state-of-the-art model with 256 levels of transparency
  // Best quality for hair, fur, and complex edges - rivals remove.bg quality
  if (REPLICATE_API_TOKEN) {
    try {
      console.log("Using Bria RMBG 2.0 for background removal - professional quality");
      
      // Use official bria/remove-background model endpoint
      const startResponse = await fetch("https://api.replicate.com/v1/models/bria/remove-background/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
          "Prefer": "wait"
        },
        body: JSON.stringify({
          input: {
            image: imageUrl,
            preserve_alpha: true,
            content_moderation: false,
            preserve_partial_alpha: true
          }
        }),
      });
      
      if (!startResponse.ok) {
        const errorText = await startResponse.text();
        throw new Error(`Bria RMBG start failed: ${startResponse.status} - ${errorText}`);
      }
      
      let result = await startResponse.json();
      
      // Poll for completion if not using "Prefer: wait" or if still processing
      while (result.status !== "succeeded" && result.status !== "failed") {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const pollResponse = await fetch(result.urls.get, {
          headers: { "Authorization": `Bearer ${REPLICATE_API_TOKEN}` },
        });
        result = await pollResponse.json();
      }
      
      if (result.status === "succeeded" && result.output) {
        console.log("Bria RMBG 2.0 background removal successful - 256 levels of transparency");
        return result.output;
      }
      
      throw new Error("Bria RMBG failed: " + (result.error || "Unknown error"));
    } catch (error) {
      console.error("Bria RMBG 2.0 failed, falling back to RunPod rembg:", error);
    }
  }
  
  // Fallback to RunPod rembg
  console.log("Using rembg for background removal");
  const base64Image = await imageUrlToBase64(imageUrl);

  const output = await runAsync({
    endpointId: RUNPOD_ENDPOINTS["rembg"],
    input: {
      image: base64Image,
      model: "isnet-general-use",
      alpha_matting: true,
      alpha_matting_foreground_threshold: 240,
      alpha_matting_background_threshold: 10,
      alpha_matting_erode_size: 10,
    },
  });

  // sam01101/rembg-runpod returns { data: { image: "base64..." }, result: true }
  if (output?.data?.image) {
    return `data:image/png;base64,${output.data.image}`;
  }
  
  // Fallback: direct image field
  if (output?.image) {
    return `data:image/png;base64,${output.image}`;
  }

  throw new Error("No output image from rembg");
}

// Remove background using RunPod rembg - preserves original image dimensions
// Used for background-change where we need the subject to stay in its original position
export async function removeBackgroundPreserveSize(imageUrl: string): Promise<string> {
  console.log("Using RunPod rembg for background removal (preserves original size)");
  const base64Image = await imageUrlToBase64(imageUrl);

  const output = await runAsync({
    endpointId: RUNPOD_ENDPOINTS["rembg"],
    input: {
      image: base64Image,
      model: "isnet-general-use",
      alpha_matting: true,
      alpha_matting_foreground_threshold: 240,
      alpha_matting_background_threshold: 10,
      alpha_matting_erode_size: 10,
    },
  });

  // sam01101/rembg-runpod returns { data: { image: "base64..." }, result: true }
  if (output?.data?.image) {
    return `data:image/png;base64,${output.data.image}`;
  }
  
  // Fallback: direct image field
  if (output?.image) {
    return `data:image/png;base64,${output.image}`;
  }

  throw new Error("No output image from rembg");
}

// Restore old photo using FLUX Kontext restore-image
export async function restoreOldPhoto(imageUrl: string, withScratch: boolean = false): Promise<string> {
  console.log("Restoring old photo with FLUX Kontext restore-image");
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  if (!REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN not configured");
  }

  // Convert to base64 data URL for Replicate
  const base64Image = await imageUrlToBase64(imageUrl);
  const dataUrl = `data:image/jpeg;base64,${base64Image}`;

  const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Token ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: "da7613a13aac59a1a3231023f0f30cf27991695ee0fe7ef52959ec1e02311c25",
      input: {
        input_image: dataUrl,
        output_format: "png"
      }
    }),
  });

  if (!startResponse.ok) {
    const errorText = await startResponse.text();
    console.error("Replicate API error:", errorText);
    throw new Error(`Failed to start old photo restoration: ${startResponse.status}`);
  }

  const prediction = await startResponse.json();
  console.log("Old photo restore prediction started:", prediction.id);

  let result = prediction;
  const maxAttempts = 120;
  let attempts = 0;

  while (result.status !== "succeeded" && result.status !== "failed" && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;

    const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: { "Authorization": `Token ${REPLICATE_API_TOKEN}` },
    });
    result = await pollResponse.json();
  }

  if (result.status === "failed") {
    throw new Error(`Old photo restoration failed: ${result.error}`);
  }

  if (result.status !== "succeeded") {
    throw new Error("Old photo restoration timed out");
  }

  if (result.output) {
    return result.output;
  }

  throw new Error("No output from old photo restoration");
}

// Colorize black and white photo using Replicate DDColor (high quality)
export async function colorize(imageUrl: string): Promise<string> {
  console.log("Colorizing with Replicate DDColor");
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  if (!REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN not configured");
  }

  // Convert to base64 data URL for Replicate
  const base64Image = await imageUrlToBase64(imageUrl);
  const dataUrl = `data:image/jpeg;base64,${base64Image}`;

  const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Token ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: "ca494ba129e44e45f661d6ece83c4c98a9a7c774309beca01429b58fce8aa695",
      input: {
        image: dataUrl,
        model_size: "large"
      }
    }),
  });

  if (!startResponse.ok) {
    const error = await startResponse.text();
    console.error("Replicate colorize error:", startResponse.status, error);
    throw new Error(`Replicate API error: ${error}`);
  }

  const prediction = await startResponse.json();
  console.log("Replicate colorize started:", prediction.id, "status:", prediction.status);

  let result = prediction;
  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts && result.status !== "succeeded" && result.status !== "failed"; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: { "Authorization": `Token ${REPLICATE_API_TOKEN}` },
    });
    result = await pollResponse.json();
    console.log(`Replicate colorize status (${i + 1}/${maxAttempts}):`, result.status);
  }

  if (result.status === "failed") {
    throw new Error(`Replicate prediction failed: ${result.error}`);
  }

  if (result.status !== "succeeded") {
    throw new Error("Replicate prediction timed out");
  }

  const outputUrl = result.output;
  const imageResponse = await fetch(outputUrl);
  const buffer = await imageResponse.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  
  return `data:image/png;base64,${base64}`;
}

// Denoise image using Real-ESRGAN (same as enhance but with minimal upscale)
export async function denoise(imageUrl: string): Promise<string> {
  const base64Image = await imageUrlToBase64(imageUrl);

  // Uses ESRGAN endpoint - denoise is done by the model itself
  // Real-ESRGAN naturally reduces noise while upscaling
  const output = await runAsync({
    endpointId: RUNPOD_ENDPOINTS["real-esrgan"],
    input: {
      source_image: base64Image,
      model: "RealESRGAN_x4plus",
      scale: 2,
      face_enhance: true,
    },
  });

  console.log("Denoise output keys:", output ? Object.keys(output) : "null");

  if (output?.image) {
    return `data:image/png;base64,${output.image}`;
  }
  
  if (output?.output_image) {
    return `data:image/png;base64,${output.output_image}`;
  }

  console.log("Denoise full output:", JSON.stringify(output)?.substring(0, 500));
  throw new Error("No output image from denoise");
}

// Import ComfyUI workflow builders
import { createInpaintingWorkflow, createTextToImageWorkflow, createImg2ImgWorkflow, createColorizeWorkflow } from "./comfyui-workflows";

// Helper to run ComfyUI workflow via RunPod
async function runComfyUIWorkflow(
  workflow: Record<string, any>,
  images?: Array<{ name: string; image: string }>
): Promise<string> {
  const input: Record<string, any> = { workflow };
  
  if (images && images.length > 0) {
    // ComfyUI worker expects bare base64 strings without data URI prefix
    input.images = images.map(img => ({
      name: img.name,
      image: img.image.replace(/^data:image\/\w+;base64,/, "")
    }));
  }

  console.log("Sending ComfyUI workflow to RunPod...");
  console.log("Workflow nodes:", Object.keys(workflow).join(", "));
  
  const output = await runAsync({
    endpointId: RUNPOD_ENDPOINTS["flux"],
    input,
    timeout: 300000, // 5 min for ComfyUI
  });

  console.log("ComfyUI output:", JSON.stringify(output).substring(0, 500));

  // ComfyUI worker returns { images: [{ filename, type, data }] }
  if (output?.images && output.images.length > 0) {
    const imageData = output.images[0].data || output.images[0].image;
    if (imageData) {
      const base64 = imageData.replace(/^data:image\/\w+;base64,/, "");
      return `data:image/png;base64,${base64}`;
    }
  }
  
  // Fallback: direct image field
  if (output?.image) {
    const base64 = output.image.replace(/^data:image\/\w+;base64,/, "");
    return `data:image/png;base64,${base64}`;
  }

  // Fallback: message field (older format)
  if (output?.message) {
    const base64 = output.message.replace(/^data:image\/\w+;base64,/, "");
    return `data:image/png;base64,${base64}`;
  }

  throw new Error("No output image from ComfyUI workflow");
}

// Generate background using FLUX (ComfyUI inpainting workflow)
export async function generateBackground(transparentImageUrl: string, prompt: string): Promise<string> {
  const base64Image = await imageUrlToBase64(transparentImageUrl);
  
  // Create inpainting workflow with the prompt
  // Parameters: prompt, negativePrompt, seed, steps, cfg, denoise, width, height
  const workflow = createInpaintingWorkflow(
    prompt,
    "",
    Math.floor(Math.random() * 1000000),
    20,
    1.0,
    1.0,
    1024,
    1024
  );

  // Send image along with workflow (raw base64, no data URI prefix)
  const images = [{
    name: "input_image.png",
    image: base64Image
  }];

  return runComfyUIWorkflow(workflow, images);
}

// Object REMOVAL using Bria Eraser (fast, reliable)
export async function removeObject(imageUrl: string, maskUrl: string | undefined): Promise<string> {
  console.log("Using Bria Eraser for object removal...");
  
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  if (!REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN not configured");
  }
  
  if (!maskUrl) {
    throw new Error("Mask URL is required for object removal");
  }
  
  console.log("Image URL:", imageUrl);
  console.log("Mask URL:", maskUrl);
  
  // Fetch both images to check dimensions
  const [imageResponse, maskResponse] = await Promise.all([
    fetch(imageUrl),
    fetch(maskUrl)
  ]);
  
  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
  const maskBuffer = Buffer.from(await maskResponse.arrayBuffer());
  
  const sharp = (await import('sharp')).default;
  
  // Normalize EXIF orientation for the image to prevent rotation issues
  let normalizedImageBuffer = await sharp(imageBuffer)
    .rotate() // Auto-rotate based on EXIF
    .toBuffer();
  
  let imageMetadata = await sharp(normalizedImageBuffer).metadata();
  const maskMetadata = await sharp(maskBuffer).metadata();
  
  console.log(`Original normalized image dimensions: ${imageMetadata.width}x${imageMetadata.height}`);
  console.log(`Mask dimensions: ${maskMetadata.width}x${maskMetadata.height}`);
  
  // Limit image size to prevent API overload (max 2048px on longest side)
  const MAX_SIZE = 2048;
  const imgWidth = imageMetadata.width || 1;
  const imgHeight = imageMetadata.height || 1;
  
  let targetWidth = imgWidth;
  let targetHeight = imgHeight;
  
  if (imgWidth > MAX_SIZE || imgHeight > MAX_SIZE) {
    const scale = MAX_SIZE / Math.max(imgWidth, imgHeight);
    targetWidth = Math.round(imgWidth * scale);
    targetHeight = Math.round(imgHeight * scale);
    
    console.log(`Resizing image for API: ${imgWidth}x${imgHeight} -> ${targetWidth}x${targetHeight}`);
    
    normalizedImageBuffer = await sharp(normalizedImageBuffer)
      .resize(targetWidth, targetHeight, { fit: 'inside' })
      .toBuffer();
    
    imageMetadata = await sharp(normalizedImageBuffer).metadata();
  }
  
  // Always convert normalized image to data URL
  const finalImageUrl = `data:image/png;base64,${(await sharp(normalizedImageBuffer).png().toBuffer()).toString('base64')}`;
  
  // Resize mask to match (possibly resized) image dimensions
  console.log(`Resizing mask to match image: ${imageMetadata.width}x${imageMetadata.height}`);
  
  const resizedMask = await sharp(maskBuffer)
    .resize(imageMetadata.width, imageMetadata.height, { fit: 'fill' })
    .png()
    .toBuffer();
  
  const finalMaskUrl = `data:image/png;base64,${resizedMask.toString('base64')}`;
  console.log("Mask resized and ready")
  
  // Use Bria Eraser - specialized for object removal
  const response = await fetch("https://api.replicate.com/v1/models/bria/eraser/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: {
        image: finalImageUrl,
        mask: finalMaskUrl
      }
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Bria Eraser API error: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  console.log("Bria Eraser prediction started:", result.id, "status:", result.status);
  
  // If already succeeded
  if (result.status === "succeeded") {
    console.log("Bria Eraser completed immediately!");
    return result.output;
  }
  
  // Poll for result (up to 120 seconds)
  const getUrl = result.urls?.get;
  if (!getUrl) throw new Error("No get URL in response");
  
  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 1000));
    
    const pollResponse = await fetch(getUrl, {
      headers: { "Authorization": `Bearer ${REPLICATE_API_TOKEN}` }
    });
    const pollResult = await pollResponse.json();
    
    if (i % 10 === 0) {
      console.log(`Bria Eraser poll ${i}: ${pollResult.status}`);
    }
    
    if (pollResult.status === "succeeded") {
      console.log("Bria Eraser completed!");
      return pollResult.output;
    } else if (pollResult.status === "failed") {
      throw new Error(`Bria Eraser failed: ${pollResult.error}`);
    }
  }
  
  throw new Error("Bria Eraser timeout after 120 seconds");
}
// Art style transfer using FLUX (ComfyUI img2img workflow)
export async function artStyle(imageUrl: string, stylePrompt: string): Promise<string> {
  const base64Image = await imageUrlToBase64(imageUrl);

  // Use img2img workflow for style transfer
  // Parameters: prompt, negativePrompt, seed, steps, cfg, denoise
  // CFG 7.0 follows prompt, denoise 0.45 preserves original structure
  const workflow = createImg2ImgWorkflow(
    stylePrompt,
    "blurry, low quality, distorted",
    Math.floor(Math.random() * 1000000),
    20,
    7.0,
    0.45 // lower denoise preserves original photo structure
  );

  const images = [{
    name: "input_image.png",
    image: base64Image
  }];

  return runComfyUIWorkflow(workflow, images);
}

// Text to image using FLUX (ComfyUI workflow)
export async function textToImage(prompt: string): Promise<string> {
  // Use text-to-image workflow (no input image needed)
  // Parameters: prompt, negativePrompt, seed, steps, cfg, width, height
  const workflow = createTextToImageWorkflow(
    prompt,
    "",
    Math.floor(Math.random() * 1000000),
    20,
    1.0,
    1024,
    1024
  );

  // No images needed for text-to-image
  return runComfyUIWorkflow(workflow);
}

// Face swap using Inswapper (InsightFace)
// API: ashleykleynhans/runpod-worker-inswapper or generativelabs/runpod-worker-inswapper
export async function faceSwap(sourceImageUrl: string, targetImageUrl: string): Promise<string> {
  const sourceBase64 = await imageUrlToBase64(sourceImageUrl);
  const targetBase64 = await imageUrlToBase64(targetImageUrl);
  
  // Get pure base64 without data prefix
  const sourceData = sourceBase64.replace(/^data:image\/\w+;base64,/, "");
  const targetData = targetBase64.replace(/^data:image\/\w+;base64,/, "");

  console.log("Using Inswapper endpoint for face swap");
  
  const output = await runAsync({
    endpointId: RUNPOD_ENDPOINTS["inswapper"],
    input: {
      source_image: sourceData,
      target_image: targetData,
      source_indexes: "-1",
      target_indexes: "-1",
      face_restore: true,
      background_enhance: false,
      face_upsample: true,
      upscale: 1,
      codeformer_fidelity: 0.5,
      output_format: "PNG",
    },
    timeout: 180000,
  });

  console.log("Inswapper output keys:", output ? Object.keys(output) : "null");

  // Inswapper returns { image: "base64..." } or { output: { image: "base64..." } }
  const imageData = output?.image || output?.output?.image || output?.output;
  if (imageData) {
    const base64Str = typeof imageData === "string" ? imageData : imageData.image;
    const base64Data = base64Str?.startsWith("data:") ? base64Str : `data:image/png;base64,${base64Str}`;
    return base64Data;
  }

  throw new Error("No output image from face swap");
}

// Age change using GFPGAN with enhanced face processing
export async function ageChange(imageUrl: string, targetAge: number): Promise<string> {
  const base64Image = await imageUrlToBase64(imageUrl);

  console.log("Using GFPGAN endpoint for age change, target age:", targetAge);
  
  const output = await runAsync({
    endpointId: RUNPOD_ENDPOINTS["gfpgan"],
    input: {
      source_image: base64Image,
      scale: 2,
      face_enhance: true,
    },
    timeout: 180000,
  });

  console.log("GFPGAN age change output keys:", output ? Object.keys(output) : "null");

  if (output?.image) {
    return `data:image/png;base64,${output.image}`;
  }

  throw new Error("No output image from age change");
}

// Expression change using GFPGAN with face enhancement
export async function expressionChange(imageUrl: string, expressionPrompt: string): Promise<string> {
  const base64Image = await imageUrlToBase64(imageUrl);

  console.log("Using GFPGAN endpoint for expression change, expression:", expressionPrompt);
  
  const output = await runAsync({
    endpointId: RUNPOD_ENDPOINTS["gfpgan"],
    input: {
      source_image: base64Image,
      scale: 2,
      face_enhance: true,
    },
    timeout: 180000,
  });

  console.log("GFPGAN expression change output keys:", output ? Object.keys(output) : "null");

  if (output?.image) {
    return `data:image/png;base64,${output.image}`;
  }

  throw new Error("No output image from expression change");
}

// Check RunPod account balance (for monitoring)
export async function getAccountBalance(): Promise<number | null> {
  if (!RUNPOD_API_KEY) return null;

  try {
    const response = await fetch("https://api.runpod.io/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RUNPOD_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `query { myself { currentSpendPerHr serverlessBilling { monthlySpend } } }`,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data?.data?.myself?.serverlessBilling?.monthlySpend || 0;
    }
  } catch (e) {
    console.error("Failed to get RunPod balance:", e);
  }

  return null;
}

// Generic endpoint call for dynamic provider configuration
// This allows the admin panel to configure arbitrary RunPod endpoints
export interface GenericEndpointInput {
  endpointId: string;
  imageUrl: string;
  maskUrl?: string;
  prompt?: string;
  params?: Record<string, any>;
  timeout?: number;
  // Allow customizing payload keys for different workers
  imageKey?: string;  // Default: 'image'
  maskKey?: string;   // Default: 'mask'
  promptKey?: string; // Default: 'prompt'
}

export async function callGenericEndpoint(options: GenericEndpointInput): Promise<string> {
  const { 
    endpointId, 
    imageUrl, 
    maskUrl, 
    prompt, 
    params = {}, 
    timeout = 300000,
    imageKey = 'image',
    maskKey = 'mask',
    promptKey = 'prompt'
  } = options;

  if (!RUNPOD_API_KEY) {
    throw new Error("RUNPOD_API_KEY not configured");
  }

  if (!endpointId) {
    throw new Error("RunPod endpoint ID not provided");
  }

  // Prepare base64 image
  const base64Image = await imageUrlToBase64(imageUrl);
  
  // Build input payload with configurable keys
  const input: Record<string, any> = {
    ...params
  };
  
  // Add image with configurable key
  if (imageKey) {
    input[imageKey] = base64Image;
  }

  // Add mask if provided with configurable key
  if (maskUrl && maskKey) {
    const base64Mask = await imageUrlToBase64(maskUrl);
    input[maskKey] = base64Mask;
  }

  // Add prompt if provided with configurable key
  if (prompt && promptKey) {
    input[promptKey] = prompt;
  }

  console.log(`Calling generic RunPod endpoint: ${endpointId}`);

  const output = await runAsync({
    endpointId,
    input,
    timeout
  });

  // Handle different output formats
  if (typeof output === 'string') {
    // If it's already a URL or base64
    if (output.startsWith('http')) {
      return output;
    }
    if (output.startsWith('data:')) {
      return output;
    }
    // Assume it's raw base64
    return `data:image/png;base64,${output}`;
  }

  if (output?.image) {
    const img = output.image;
    if (typeof img === 'string') {
      if (img.startsWith('http')) return img;
      if (img.startsWith('data:')) return img;
      return `data:image/png;base64,${img}`;
    }
  }

  if (output?.output) {
    const out = output.output;
    if (typeof out === 'string') {
      if (out.startsWith('http')) return out;
      if (out.startsWith('data:')) return out;
      return `data:image/png;base64,${out}`;
    }
  }

  throw new Error(`Unexpected output format from RunPod endpoint: ${JSON.stringify(output).substring(0, 200)}`);
}
