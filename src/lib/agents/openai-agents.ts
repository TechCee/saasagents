import OpenAI from "openai";

const DEFAULT_MODEL = "gpt-4o-mini";

export const BUILTIN_AGENT_TYPES = [
  "lead_sourcing",
  "email_communications",
  "blog_content",
  "seo",
  "standup",
  "orchestrator",
] as const;

export type BuiltinAgentType = (typeof BUILTIN_AGENT_TYPES)[number];

const AGENT_INSTRUCTIONS: Record<BuiltinAgentType, string> = {
  lead_sourcing:
    "You are OpSync Lead Sourcing. In 2–4 short bullet points, outline realistic next actions to find and qualify leads for a B2B product team (channels, signals, CRM hygiene). No invented company names.",
  email_communications:
    "You are OpSync Email Communications. Draft a concise 3-bullet follow-up strategy for a campaign (timing, tone, unsubscribe awareness).",
  blog_content:
    "You are OpSync Blog Writer. Propose one blog outline (title + 3 subheads + CTA) for a technical audience.",
  seo:
    "You are OpSync SEO. Give 3 actionable on-page or technical SEO checks for the week (no keyword stuffing advice).",
  standup:
    "You are OpSync Standup. Produce a brief yesterday / today / blockers style summary suitable for an ops automation team (3 lines max).",
  orchestrator:
    "You coordinate OpSync agents. In 4 bullets, summarize priorities across lead sourcing, email, content, and SEO for the next 24h.",
};

function isBuiltin(type: string): type is BuiltinAgentType {
  return (BUILTIN_AGENT_TYPES as readonly string[]).includes(type);
}

export function getAgentSystemPrompt(agentType: string): string {
  if (isBuiltin(agentType)) return AGENT_INSTRUCTIONS[agentType];
  return `You are the OpSync agent "${agentType}". Answer briefly with concrete operational next steps (bullet list, max 5 items).`;
}

export function getOpenAIClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
}

export async function runAgentCompletion(
  agentType: string,
  userInstruction?: string | null,
  opts?: { model?: string | null; systemPrompt?: string | null },
): Promise<{
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}> {
  const client = getOpenAIClient();
  if (!client) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  const model =
    opts?.model?.trim() || getOpenAIModel();
  const system =
    opts?.systemPrompt?.trim() || getAgentSystemPrompt(agentType);
  const user =
    userInstruction?.trim() ||
    "Run a short autonomous pass and output only the bullets, no preamble.";

  const res = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    max_tokens: 600,
    temperature: 0.4,
  });

  const choice = res.choices[0];
  const text = choice?.message?.content?.trim() || "";
  const usage = res.usage;

  return {
    text,
    inputTokens: usage?.prompt_tokens ?? 0,
    outputTokens: usage?.completion_tokens ?? 0,
    model,
  };
}
