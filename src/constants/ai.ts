export const AI = {
  provider: (process.env.AI_PROVIDER ?? "openai").toLowerCase(),
  baseUrl: process.env.AI_BASE_URL ?? "https://api.openai.com/v1",
  apiKey: process.env.AI_API_KEY ?? "",
  model: process.env.AI_MODEL ?? "gpt-4o-mini",
  /** Max tokens for a single generation. */
  maxTokens: Number(process.env.AI_MAX_TOKENS ?? 2048),
  /** Default temperature for creative outputs. */
  temperature: Number(process.env.AI_TEMPERATURE ?? 0.7),
  /** Daily usage limit (tokens) per clinic before AI is disabled. */
  defaultDailyTokenLimit: Number(process.env.AI_DAILY_TOKEN_LIMIT ?? 50000),
} as const;

export const AI_FEATURES = {
  /** Dental AI Copilot: clinical note / chart suggestions. */
  copilot: { slug: "copilot", name: "AI Dental Copilot" },
} as const;
