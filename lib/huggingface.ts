import { InferenceClient } from "@huggingface/inference";
import { AppError } from "@/lib/errors";

const DEFAULT_IMAGE_MODEL = "black-forest-labs/FLUX.1-schnell";

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

function toDataUrl(imageData: string): string {
  if (imageData.startsWith("data:") || imageData.startsWith("http")) {
    return imageData;
  }

  return `data:image/png;base64,${imageData}`;
}

export async function generateImageFromPrompt(prompt: string): Promise<string> {
  const { apiKey, model } = getHuggingFaceConfig();
  const client = new InferenceClient(apiKey);

  try {
    const imageData = (await client.textToImage({
      model,
      inputs: prompt,
      provider: "auto",
      parameters: { num_inference_steps: 4 },
    })) as Blob | string;

    if (imageData instanceof Blob) {
      const buffer = Buffer.from(await imageData.arrayBuffer());
      const contentType = imageData.type || "image/png";
      return `data:${contentType};base64,${buffer.toString("base64")}`;
    }

    return toDataUrl(imageData);
  } catch {
    throw new AppError("IMAGE_FAILED");
  }
}
