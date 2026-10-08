# Contributing

Use Node.js 24 and pnpm 11. Run `pnpm install --frozen-lockfile`, `pnpm run build`, `pnpm run lint`, and `pnpm test`. The tests mock the HTTP boundary and do not charge for searches. A real search requires an authorized key; never place keys or full private query results in commits. Submit changes through a pull request with API contract, tests and example updates. Keep the package limited to Google Search and free of runtime dependencies.
