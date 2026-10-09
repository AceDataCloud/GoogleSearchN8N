# Google Search for n8n: first search

Search Google web results in an n8n workflow through AceDataCloud. This guide uses the n8n 2.42.3 interface in English. The package is an AceDataCloud integration, not an official Google package.

**Package:** `@acedatacloud/n8n-nodes-google-search` · **Source:** [GoogleSearchN8N](https://github.com/AceDataCloud/GoogleSearchN8N) · **API and current pricing:** [Google Search](https://platform.acedata.cloud/documents/44c86226-8eaa-49bf-85f3-1fae8d2e23f1)

## 1. Install the node

On a self-hosted n8n instance, sign in as an owner or admin. Open **Settings → Community nodes → Install** and enter `@acedatacloud/n8n-nodes-google-search`. Review the package name and author **Ace Data Cloud**, accept n8n's installation notice, then select **Install**. The instance must reach npm and `api.acedata.cloud` over HTTPS.

n8n Cloud exposes community nodes through the node picker only after n8n verifies them. Check the node picker for the current verification status; an npm release alone does not enable Cloud installation. [n8n's installation instructions](https://docs.n8n.io/integrations/community-nodes/installation-and-management/gui-installation/) explain the self-hosted path.

![Google Search visible in a local n8n 2.42.3 node picker](https://raw.githubusercontent.com/AceDataCloud/GoogleSearchN8N/main/_assets/tutorial/01-node-picker.png)

## 2. Get an API key with Google Search access

1. Sign in to [Ace Data Cloud → Applications](https://platform.acedata.cloud/console/applications).
2. Open **General application**. Copy its API key, or choose **Manage Keys → Create** to issue a separate key for n8n.
3. If you enable **Allowed APIs**, include `/serp/google`. Check Google Search access, your current price, and the available balance before running the workflow.

![Copy an existing Ace Data Cloud key or open Manage Keys](https://raw.githubusercontent.com/AceDataCloud/GPTImageDify/87dd8342fe7cfbe7a1614652147c535dddc7bd68/_assets/tutorial/get-api-key-en.png)

For a separate key, choose a name and expiration in **Manage Keys → Create**, then copy the new token.

![Create a separate Ace Data Cloud key](https://raw.githubusercontent.com/AceDataCloud/GPTImageDify/87dd8342fe7cfbe7a1614652147c535dddc7bd68/_assets/tutorial/create-api-key-en.png)

Copy only the token. Do not paste `Bearer `, quotation marks, or a platform management token. Keep the token out of prompts and workflow exports.

## 3. Save the credential in n8n

Create a workflow and add **Google Search by AceDataCloud**. In **Credential**, select **Connect to Google Search by AceDataCloud** and then **Create new credential**. Paste the token into **API Token** and save. n8n stores the masked value in its credential store and adds the Bearer header when the node runs.

For least privilege, set **Allowed HTTP Request Domains** to **Specific Domains** and enter `api.acedata.cloud` before saving.

![Create the masked n8n credential](https://raw.githubusercontent.com/AceDataCloud/GoogleSearchN8N/main/_assets/tutorial/02-credential.png)

![Saved credential restricted to the Ace Data Cloud API host](https://raw.githubusercontent.com/AceDataCloud/GoogleSearchN8N/main/_assets/tutorial/03-credential-saved.png)

The credential test calls the free `/openai/models` metadata route. It checks the token, not Google Search entitlement. The first actual search verifies service access.

## 4. Run the smallest workflow

Add **Manual Trigger**, then connect it to **Google Search by AceDataCloud**. Set:

| Field | First-run value |
| --- | --- |
| Query | `site:n8n.io verified community nodes` |
| Type | `Web` |
| Number of Results | `3` |
| Page | `1` |

Leave Country, Language and Time Range empty. Keep **Retry On Fail** off: a retry can submit another paid search. Select **Execute workflow** once. The search is synchronous, so no task ID or polling node is needed.

[Download the credential-free workflow](https://github.com/AceDataCloud/GoogleSearchN8N/raw/refs/heads/main/examples/quickstart.json), then use the workflow's **⋯ → Import → From file** action and assign your own credential to the Google Search node. The export contains no token or saved result.

![Search parameters and selected credential in n8n](https://raw.githubusercontent.com/AceDataCloud/GoogleSearchN8N/main/_assets/tutorial/04-configure.png)

![One completed workflow execution](https://raw.githubusercontent.com/AceDataCloud/GoogleSearchN8N/main/_assets/tutorial/05-execution.png)

## 5. Read the result and the charge

Open the Google Search node's output. Web results appear in `organic`; each item has fields such as `title`, `link`, `snippet` and `position`. One actual n8n 2.42.3 validation run returned three results, including:

```json
{
  "organic": [
    { "title": "Install verified community nodes", "link": "https://docs.n8n.io/integrations/community-nodes/installation-and-management/install-verified-community-nodes", "position": 1 }
  ],
  "cost": { "amount": 0.009, "currency": "credit" }
}
```

![Actual n8n search output and Credits amount](https://raw.githubusercontent.com/AceDataCloud/GoogleSearchN8N/main/_assets/tutorial/06-result.png)

`cost.amount` is in **Credits**, not USD. This validation run's `0.009 Credits` matched one 200 usage record for the same test key and time window. The exact charge depends on the current service price, search type and your account package. Check your own matching request in Ace Data Cloud usage history using the execution time and trace ID if present. For downstream work, map `organic` to the next node. Images, news, maps, places and videos return different fields; inspect their actual output before mapping.

## Troubleshooting

| What you see | What to check |
| --- | --- |
| 401 or 403 | Paste the application API token without `Bearer `; check expiry, Google Search access and Allowed APIs. |
| 400 | Use a nonempty query, 1–100 results, page 1–100 and a supported search type. Image Size is only sent for Images; Time Range only for Web and News. |
| 429 | Reduce concurrency and check service limits. Do not enable automatic paid retries. |
| Connection failure or 5xx | Inspect Ace Data Cloud request history before running the workflow again; the first request may have completed and incurred a charge. |
| No `organic` array | Inspect the selected Type and the full output. Some queries have no results and non-web types use other result fields. |

## More capabilities

The node also supports image size, country, language and date filters. Each incoming n8n item makes one search request and outputs one item linked to that input. It can be connected as an **AI Agent tool**; use a restrictive query and review agent execution counts because each tool call is a separate search. The node sends requests only to `https://api.acedata.cloud/serp/google`, has no runtime package dependencies, reads no files or environment variables, and does not automatically retry or follow redirects.

[Privacy](https://github.com/AceDataCloud/GoogleSearchN8N/blob/main/PRIVACY.md) · [Report an issue](https://github.com/AceDataCloud/GoogleSearchN8N/issues) · dev@acedata.cloud
