const TOKENS_PER_MILLION = 1_000_000;

/**
 * Calculate input, output, and total LLM usage costs in USD.
 *
 * @param {{ inputTokens: number, outputTokens: number }} usage
 * @param {{ inputUsdPerMillion: number, outputUsdPerMillion: number }} pricing
 * @returns {{ inputCostUsd: number, outputCostUsd: number, totalCostUsd: number }}
 */
export function calculateTokenCost(usage, pricing) {
  assertObject(usage, "usage");
  assertObject(pricing, "pricing");

  const inputTokens = assertTokenCount(usage.inputTokens, "usage.inputTokens");
  const outputTokens = assertTokenCount(usage.outputTokens, "usage.outputTokens");
  const inputRate = assertRate(
    pricing.inputUsdPerMillion,
    "pricing.inputUsdPerMillion",
  );
  const outputRate = assertRate(
    pricing.outputUsdPerMillion,
    "pricing.outputUsdPerMillion",
  );

  const inputCostUsd = (inputTokens * inputRate) / TOKENS_PER_MILLION;
  const outputCostUsd = (outputTokens * outputRate) / TOKENS_PER_MILLION;

  return {
    inputCostUsd,
    outputCostUsd,
    totalCostUsd: inputCostUsd + outputCostUsd,
  };
}

function assertObject(value, name) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object`);
  }
}

function assertTokenCount(value, name) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${name} must be a non-negative safe integer`);
  }

  return value;
}

function assertRate(value, name) {
  if (!Number.isFinite(value) || value < 0) {
    throw new TypeError(`${name} must be a non-negative finite number`);
  }

  return value;
}
