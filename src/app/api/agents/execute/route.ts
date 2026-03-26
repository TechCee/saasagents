import { NextResponse } from "next/server";
import { z } from "zod";
import { executeAgentOnce } from "@/lib/agents/execute-agent";
import {
  BUILTIN_AGENT_TYPES,
  getOpenAIClient,
} from "@/lib/agents/openai-agents";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isUiPreviewMode } from "@/lib/ui-preview";

const RUN_ALL_TYPES = BUILTIN_AGENT_TYPES.filter((t) => t !== "orchestrator");

const bodySchema = z
  .object({
    agent_type: z.string().min(1).optional(),
    run_all: z.boolean().optional(),
    instruction: z.string().max(8000).optional(),
    model: z.string().max(64).optional(),
    system_prompt: z.string().max(12000).optional(),
  })
  .refine((b) => b.run_all || b.agent_type, {
    message: "Provide agent_type or run_all: true",
  });

type ExecResult = Awaited<ReturnType<typeof executeAgentOnce>>;

/**
 * Runs one or all built-in agents via OpenAI, then records to agent_logs (session auth).
 */
export async function POST(req: Request) {
  if (isUiPreviewMode()) {
    return NextResponse.json(
      {
        error:
          "Agent execution is disabled in UI preview mode. Set UI_PREVIEW_MODE=false and sign in.",
      },
      { status: 403 },
    );
  }

  if (!getOpenAIClient()) {
    return NextResponse.json(
      {
        error:
          "OPENAI_API_KEY is not set. Add it to .env.local to run agents.",
      },
      { status: 503 },
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("organisation_id")
    .eq("id", user.id)
    .maybeSingle();

  const organisationId = (profile as { organisation_id?: string } | null)
    ?.organisation_id;
  if (!organisationId) {
    return NextResponse.json(
      { error: "No organisation linked to this account" },
      { status: 403 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { agent_type, run_all, instruction, model, system_prompt } =
    parsed.data;

  const results: ExecResult[] = [];

  if (run_all) {
    const runAllOpts = { model: model ?? null, systemPrompt: null as string | null };
    for (const t of RUN_ALL_TYPES) {
      results.push(
        await executeAgentOnce(
          organisationId,
          t,
          instruction,
          "api/agents/execute",
          null,
          runAllOpts,
        ),
      );
    }
  } else if (agent_type) {
    results.push(
      await executeAgentOnce(
        organisationId,
        agent_type,
        instruction,
        "api/agents/execute",
        null,
        {
          model: model ?? null,
          systemPrompt: system_prompt ?? null,
        },
      ),
    );
  }

  const allOk = results.every((r) => r.ok);
  return NextResponse.json(
    { ok: allOk, results },
    { status: allOk ? 200 : 207 },
  );
}
