# GoogleSearchN8N

Independent n8n community node for the AceDataCloud Google Search API. Use `pnpm install --frozen-lockfile`, `pnpm run build`, `pnpm run lint`, and `pnpm test`. Keep strict mode and no runtime dependencies beyond n8n-workflow. Never read files, environment variables, or credentials in node runtime code. Use n8n's authenticated HTTP helper; one input item makes one paid search request, with no automatic retry or redirect. Keep examples free of credentials and fabricated results. Deliver changes through PRs under Ace Data Cloud Dev.
