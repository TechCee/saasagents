import {
  BUILTIN_AGENT_TYPES,
  runAgentCompletion,
} from "@/lib/agents/openai-agents";
import {
  maybeSendFailureAlert,
  persistAgentRun,
} from "@/lib/agents/persist-run";

export type AgentExecuteOptions = {
  model?: string | null;
  systemPrompt?: string | null;
};

export type AgentExecuteResult = {
  agent_type: string;
  ok: boolean;
  summary?: string;
  log_id?: string;
  estimated_cost_usd?: number;
  error?: string;
};

/**
 * Runs OpenAI for one agent type and persists to agent_logs.
 */
export async function executeAgentOnce(
  organisationId: string,
  agentType: string,
  instruction: string | undefined,
  source: string,
  productId?: string | null,
  options?: AgentExecuteOptions,
): Promise<AgentExecuteResult> {
  try {
    if (!agentType.trim()) {
      return { agent_type: agentType, ok: false, error: "Missing agent_type" };
    }

    const { text, inputTokens, outputTokens, model } =
      await runAgentCompletion(agentType, instruction, {
        model: options?.model,
        systemPrompt: options?.systemPrompt,
      });

    const persisted = await persistAgentRun({
      organisation_id: organisationId,
      agent_type: agentType,
      product_id: productId ?? null,
      status: "success",
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      payload: {
        model,
        summary: text,
        source,
      },
      consecutive_errors: 0,
    });

    if (!persisted.ok) {
      let error = "Run blocked (rate limit or spend limit)";
      try {
        const errBody = (await persisted.response.clone().json()) as {
          error?: unknown;
        };
        if (typeof errBody?.error === "string") error = errBody.error;
      } catch {
        /* ignore */
      }
      return { agent_type: agentType, ok: false, error };
    }

    return {
      agent_type: agentType,
      ok: true,
      summary: text,
      log_id: persisted.id,
      estimated_cost_usd: persisted.estimated_cost_usd,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const persisted = await persistAgentRun({
      organisation_id: organisationId,
      agent_type: agentType,
      product_id: productId ?? null,
      status: "error",
      input_tokens: 0,
      output_tokens: 0,
      error_message: msg,
      payload: { source, phase: "openai" },
      consecutive_errors: 1,
    });

    if (persisted.ok) {
      await maybeSendFailureAlert(agentType, organisationId, 1);
    }

    return {
      agent_type: agentType,
      ok: false,
      error: msg,
      log_id: persisted.ok ? persisted.id : undefined,
    };
  }
}

export function isBuiltinAgentType(t: string): boolean {
  return (BUILTIN_AGENT_TYPES as readonly string[]).includes(t);
}
