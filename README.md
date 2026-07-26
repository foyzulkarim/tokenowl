# tokenowl

A small, dependency-free utility for calculating LLM token usage costs from per-million-token pricing.

## Installation

```sh
npm install tokenowl
```

## Usage

```js
import { calculateTokenCost } from "tokenowl";

const cost = calculateTokenCost(
  {
    inputTokens: 250_000,
    outputTokens: 100_000,
  },
  {
    inputUsdPerMillion: 3,
    outputUsdPerMillion: 15,
  },
);

console.log(cost);
// {
//   inputCostUsd: 0.75,
//   outputCostUsd: 1.5,
//   totalCostUsd: 2.25
// }
```

## API

### `calculateTokenCost(usage, pricing)`

`usage` requires non-negative safe integers:

- `inputTokens`
- `outputTokens`

`pricing` requires non-negative finite numbers:

- `inputUsdPerMillion`
- `outputUsdPerMillion`

The function returns `inputCostUsd`, `outputCostUsd`, and `totalCostUsd`. Invalid values throw a `TypeError`.

## Status

TokenOwl is in early development. The API may change before version 1.0.0.

## License

MIT
