# Privacy

The n8n node sends the configured search query, filters and API token to `https://api.acedata.cloud/serp/google`. AceDataCloud returns search results and usage information. The node does not send data to another host, read local files or environment variables, or add its own telemetry. n8n stores the token in its credential store; do not include it in workflow exports. Search results may contain links to third-party websites, which are opened only when a user or downstream workflow follows them.

See [AceDataCloud privacy policy](https://platform.acedata.cloud/privacy) and [current Google Search pricing](https://platform.acedata.cloud/documents/44c86226-8eaa-49bf-85f3-1fae8d2e23f1).
