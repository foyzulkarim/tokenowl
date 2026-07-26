export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface TokenPricing {
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
}

export interface TokenCost {
  inputCostUsd: number;
  outputCostUsd: number;
  totalCostUsd: number;
}

export function calculateTokenCost(
  usage: TokenUsage,
  pricing: TokenPricing,
): TokenCost;
