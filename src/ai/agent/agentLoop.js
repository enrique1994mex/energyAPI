import Anthropic from '@anthropic-ai/sdk';
import { AppError } from '../../errors/AppError.js';
import logger from '../../config/logger.js';
import { CLAUDE_AGENT_SYSTEM } from './prompts.js';
import { AGENT_TOOLS } from './toolRegistry.js';
import { executeToolCall } from './toolExecutor.js';

const MAX_ITERATIONS = 5;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function parseResponse(text) {
  try {
    return JSON.parse(text.trim());
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new AppError('El modelo no devolvió un JSON válido', 502);
  }
}

export async function agentLoop(messages, contractId, userId) {
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    logger.info({ event: 'claude_request', model: 'claude-haiku-4-5-20251001', contractId, iteration: i + 1 }, 'ai metric');

    const start = Date.now();
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: CLAUDE_AGENT_SYSTEM,
      tools: AGENT_TOOLS,
      messages,
    });

    logger.info({
      event: 'claude_response',
      contractId,
      iteration: i + 1,
      stopReason: response.stop_reason,
      durationMs: Date.now() - start,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    }, 'ai metric');

    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find(b => b.type === 'text');
      if (!textBlock) throw new AppError('El agente no devolvió respuesta de texto', 502);
      return parseResponse(textBlock.text);
    }

    if (response.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: response.content });

      const toolResults = await Promise.all(
        response.content
          .filter(b => b.type === 'tool_use')
          .map(async (toolUse) => {
            try {
              const result = await executeToolCall(toolUse.name, toolUse.input, contractId, userId);
              logger.debug({ contractId, tool: toolUse.name }, 'tool executed');
              return {
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: JSON.stringify(result),
              };
            } catch (err) {
              logger.warn({ contractId, tool: toolUse.name, error: err.message }, 'tool error');
              return {
                type: 'tool_result',
                tool_use_id: toolUse.id,
                is_error: true,
                content: err.message,
              };
            }
          })
      );

      messages.push({ role: 'user', content: toolResults });
    }
  }

  throw new AppError(`El agente superó el límite de ${MAX_ITERATIONS} iteraciones sin respuesta final`, 502);
}
