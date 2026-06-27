import { AppError } from "@/lib/errors";

const DEFAULT_IMAGE_MODEL = "black-forest-labs/FLUX.1-schnell";
const HF_ROUTER_URL = "https://router.huggingface.co/hf-inference/models";

type ImageGenerationResponse = {
  data?: Array<{ b64_json?: string }>;
  output?: string[];
  error?: string;
  estimated_time?: number;
};

function getHuggingFaceConfig() {
  const apiKey = process.env.HUGGINGFACE_API_KEY;

  if (!apiKey) {
    throw new AppError("IMAGE_CONFIG_ERROR");
  }

  return {
    apiKey,
    model: process.env.HUGGINGFACE_IMAGE_MODEL ?? DEFAULT_IMAGE_MODEL,
  };
}

function mapHttpImageError(status: number, body: string): never {
  if (
    status === 401 ||
    status === 403 ||
    body.includes("sufficient permissions") ||
    body.includes("Invalid username or password")
  ) {
    throw new AppError("IMAGE_PERMISSION_DENIED");
  }

  if (body.includes("Model") && body.includes("loading")) {
    throw new AppError("IMAGE_MODEL_LOADING");
  }

  throw new AppError("IMAGE_FAILED");
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  const buffer = Buffer.from(await blob.arrayBuffer());
  const contentType = blob.type || "image/png";
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

async function parseImageResponse(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.startsWith("image/")) {
    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  }

  const json = (await response.json()) as ImageGenerationResponse;

  if (json.data?.[0]?.b64_json) {
    return `data:image/jpeg;base64,${json.data[0].b64_json}`;
  }

  if (json.output?.[0]) {
    const imageResponse = await fetch(json.output[0]);
    if (!imageResponse.ok) {
      throw new AppError("IMAGE_FAILED");
    }
    return blobToDataUrl(await imageResponse.blob());
  }

  if (json.error) {
    if (json.error.includes("loading")) {
      throw new AppError("IMAGE_MODEL_LOADING");
    }
    mapHttpImageError(response.status, json.error);
  }

  throw new AppError("IMAGE_FAILED");
}

export async function generateImageFromPrompt(prompt: string): Promise<string> {
  const { apiKey, model } = getHuggingFaceConfig();
  const url = `${HF_ROUTER_URL}/${model}`;

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { num_inference_steps: 4 },
      }),
      signal: AbortSignal.timeout(120000),
    });
  } catch {
    throw new AppError("AI_TIMEOUT");
  }

  if (!response.ok) {
    const body = await response.text();
    mapHttpImageError(response.status, body);
  }

  try {
    return await parseImageResponse(response);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("IMAGE_FAILED");
  }
}
