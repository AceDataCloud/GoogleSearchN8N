const { test } = require('node:test');
const assert = require('node:assert/strict');
const { GoogleSearch, searchBody } = require('../dist/nodes/GoogleSearch/GoogleSearch.node.js');
const { AceDataGoogleSearchApi } = require('../dist/credentials/AceDataGoogleSearchApi.credentials.js');

const base = {
  query: 'site:n8n.io community nodes', type: 'search', number: 3, page: 1,
  country: '', language: '', range: '', imageSize: '',
};
function context(parameters, responses = [], continueOnFail = false) {
  const calls = [];
  let next = 0;
  return {
    calls,
    getInputData: () => parameters.map(() => ({ json: {} })),
    getNode: () => ({ name: 'Google Search', type: '@acedatacloud/n8n-nodes-google-search.googleSearch', typeVersion: 1, position: [0, 0], parameters: {} }),
    getNodeParameter: (name, index, fallback) => parameters[index][name] ?? fallback,
    getCredentials: async () => ({ apiToken: 'test-token' }),
    continueOnFail: () => continueOnFail,
    helpers: {
      httpRequestWithAuthentication: async (credential, request) => {
        calls.push({ credential, ...request });
        const response = responses[next++];
        if (response instanceof Error) throw response;
        return response;
      },
    },
  };
}

const node = new GoogleSearch();
test('one input makes one authenticated search and keeps the returned fields and item link', async () => {
  const result = { organic: [{ title: 'n8n Docs', link: 'https://docs.n8n.io/' }], cost: { amount: 0.009, currency: 'credit' } };
  const ctx = context([base], [result]);
  const [items] = await node.execute.call(ctx);
  assert.equal(ctx.calls.length, 1);
  assert.equal(ctx.calls[0].credential, 'aceDataGoogleSearchApi');
  assert.equal(ctx.calls[0].method, 'POST');
  assert.equal(ctx.calls[0].url, 'https://api.acedata.cloud/serp/google');
  assert.equal(ctx.calls[0].disableFollowRedirect, true);
  assert.deepEqual(ctx.calls[0].body, { query: base.query, type: 'search', number: 3, page: 1 });
  assert.deepEqual(items[0], { json: result, pairedItem: { item: 0 } });
});

test('image size and time range only belong to their matching search types', () => {
  const images = searchBody((name) => ({ ...base, type: 'images', imageSize: '4mp', range: 'w' })[name]);
  assert.equal(images.image_size, '4mp');
  assert.equal(images.range, undefined);
  const news = searchBody((name) => ({ ...base, type: 'news', imageSize: '4mp', range: 'w' })[name]);
  assert.equal(news.range, 'w');
  assert.equal(news.image_size, undefined);
});

test('invalid input never sends a billable search', async () => {
  for (const bad of [{ query: '   ' }, { number: 0 }, { page: 1.5 }, { type: 'shopping' }, { country: 'x'.repeat(33) }]) {
    const ctx = context([{ ...base, ...bad }]);
    await assert.rejects(node.execute.call(ctx));
    assert.equal(ctx.calls.length, 0);
  }
});

test('no automatic retry after an uncertain transport failure; continue-on-fail advances to next item', async () => {
  const ctx = context([base, base], [new Error('connection lost'), { organic: [] }], true);
  const [items] = await node.execute.call(ctx);
  assert.equal(ctx.calls.length, 2);
  assert.match(items[0].json.error, /request history/i);
  assert.deepEqual(items[1].pairedItem, { item: 1 });
});

test('missing n8n credential stops before a service request', async () => {
  const ctx = context([base], [new Error('Credentials not found')]);
  await assert.rejects(node.execute.call(ctx), /credential is required/i);
  assert.equal(ctx.calls.length, 1);
});

test('credentials mask the token and test only the free metadata route', () => {
  const credential = new AceDataGoogleSearchApi();
  assert.equal(credential.properties[0].typeOptions.password, true);
  assert.match(credential.authenticate.properties.headers.Authorization, /Bearer/);
  assert.equal(credential.test.request.url, '/openai/models');
  assert.equal(credential.test.request.method, 'GET');
});
