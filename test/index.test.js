import assert from "node:assert/strict";
import test from "node:test";

import { calculateTokenCost } from "../src/index.js";

test("calculates input, output, and total costs", () => {
  assert.deepEqual(
    calculateTokenCost(
      { inputTokens: 250_000, outputTokens: 100_000 },
      { inputUsdPerMillion: 3, outputUsdPerMillion: 15 },
    ),
    {
      inputCostUsd: 0.75,
      outputCostUsd: 1.5,
      totalCostUsd: 2.25,
    },
  );
});

test("supports zero usage and zero-cost pricing", () => {
  assert.deepEqual(
    calculateTokenCost(
      { inputTokens: 0, outputTokens: 0 },
      { inputUsdPerMillion: 0, outputUsdPerMillion: 0 },
    ),
    {
      inputCostUsd: 0,
      outputCostUsd: 0,
      totalCostUsd: 0,
    },
  );
});

test("rejects invalid token counts", () => {
  for (const inputTokens of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(
      () =>
        calculateTokenCost(
          { inputTokens, outputTokens: 0 },
          { inputUsdPerMillion: 1, outputUsdPerMillion: 1 },
        ),
      { name: "TypeError", message: /non-negative safe integer/ },
    );
  }
});

test("rejects invalid pricing", () => {
  for (const inputUsdPerMillion of [-1, Number.POSITIVE_INFINITY, NaN]) {
    assert.throws(
      () =>
        calculateTokenCost(
          { inputTokens: 1, outputTokens: 0 },
          { inputUsdPerMillion, outputUsdPerMillion: 1 },
        ),
      { name: "TypeError", message: /non-negative finite number/ },
    );
  }
});
