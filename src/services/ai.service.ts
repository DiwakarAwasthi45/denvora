import { AI } from "@/constants/ai";
import { devLog } from "@/lib/dev-log";
import type { TenantContext } from "@/types";
import { AiUsageModel } from "@/models/AiUsage";
import { connectDB } from "@/lib/db";
import { ApiError } from "@/lib/api";

export type AiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export interface AiRequest {
  messages: AiMessage[];
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export interface AiResult {
  text: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cached?: boolean;
}

/**
 * Dental-specific system prompt shared across AI features.
 * Stays under 1024 tokens and keeps clinical tone.
 */
const SYSTEM_PROMPT =
  "You are Denvora AI, a dental assistant for a multi-branch dental practice SaaS. " +
  "You provide concise, clinically accurate, Nepalese-context-aware guidance. " +
  "You never provide medical diagnosis — only suggestions and educational content. " +
  "You return plain text; never emit markdown formatting unless explicitly asked. " +
  "You never ask for or reference any payment or personal data beyond what is needed for clinical suggestions.";

/**
 * Provider-agnostic AI client.
 * - Uses OpenAI-compatible endpoint when AI_API_KEY is present.
 * - Falls back to a logged dev stub (dev.log) when no key is configured,
 *   so features keep working offline and never crash the app.
 */
export class AiService {
  private static readonly FALLBACK_TEXT =
    "AI suggestion (dev mode): Review the patient's chart history before recommending any intervention.";

  static async chat(
    context: TenantContext,
    input: AiRequest
  ): Promise<AiResult> {
    const messages: AiMessage[] = [{ role: "system", content: SYSTEM_PROMPT }, ...input.messages];
    const model = input.model ?? AI.model;
    const maxTokens = input.maxTokens ?? AI.maxTokens;
    const temperature = input.temperature ?? AI.temperature;

    // --- Real provider call (OpenAI-compatible) ---
    if (AI.apiKey) {
      let completion;
      try {
        const { default: OpenAI } = await import("openai");
        const client = new OpenAI({
          apiKey: AI.apiKey,
          baseURL: AI.baseUrl,
        });

        completion = await client.chat.completions.create({
          model,
          messages: messages as unknown as Array<{ role: "system" | "user" | "assistant"; content: string }>,
          max_tokens: maxTokens,
          temperature,
        });
      } catch (error) {
        throw ApiError.internal(
          `AI provider error: ${error instanceof Error ? error.message : "request failed"}`
        );
      }

      const text = completion.choices?.[0]?.message?.content?.trim() ?? "";
      const inputTokens = completion.usage?.prompt_tokens ?? 0;
      const outputTokens = completion.usage?.completion_tokens ?? 0;

      await this.recordUsage(context, model, inputTokens, outputTokens);

      return {
        text,
        provider: AI.provider,
        model,
        inputTokens,
        outputTokens,
        cached: false,
      };
    }

    // --- Dev fallback: log + return stub ---
    devLog(`[AI/dev] stub chat for clinic ${context.clinicId}`, {
      model,
      maxTokens,
      temperature,
      messages: input.messages.length,
      firstUser: input.messages[0]?.content?.slice(0, 120),
    });

    return {
      text: this.FALLBACK_TEXT,
      provider: "dev-stub",
      model: `${model} (dev stub)`,
      inputTokens: 0,
      outputTokens: 0,
      cached: false,
    };
  }

  /** Check the clinic's daily token quota; throws if exhausted. */
  static async assertQuota(context: TenantContext, estimatedTokens: number): Promise<void> {
    if (!context.clinicId) return;
    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayKey = today.toISOString().slice(0, 10);

    const record = await AiUsageModel.findOneAndUpdate(
      { clinicId: context.clinicId, day: dayKey },
      { $inc: { tokens: estimatedTokens } },
      { new: true, upsert: true }
    ).lean();

    if (record && record.tokens > AI.defaultDailyTokenLimit) {
      devLog(`[AI/quota] clinic ${context.clinicId} exceeded daily limit (${record.tokens})`);
      throw ApiError.rateLimited("AI daily token limit exceeded. Try again tomorrow.");
    }
  }

  private static async recordUsage(
    context: TenantContext,
    model: string,
    inputTokens: number,
    outputTokens: number
  ): Promise<void> {
    if (!context.clinicId) return;
    try {
      await connectDB();

      await AiUsageModel.updateOne(
        { clinicId: context.clinicId, day: new Date().toISOString().slice(0, 10) },
        { $inc: { tokens: inputTokens + outputTokens }, $addToSet: { models: model } },
        { upsert: true }
      ).exec();
    } catch {
      devLog("[AI/usage] failed to record token usage", { clinicId: context.clinicId, model });
    }
  }
}
