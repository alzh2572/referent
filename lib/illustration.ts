import type { ParsedArticle } from "@/lib/parse-article";
import { createIllustrationPrompt } from "@/lib/openrouter";
import { generateImageFromPrompt } from "@/lib/huggingface";

export type IllustrationResult = {
  imagePrompt: string;
  imageUrl: string;
};

export async function generateIllustration(
  article: ParsedArticle,
): Promise<IllustrationResult> {
  const imagePrompt = await createIllustrationPrompt(article);
  const imageUrl = await generateImageFromPrompt(imagePrompt);

  return { imagePrompt, imageUrl };
}
