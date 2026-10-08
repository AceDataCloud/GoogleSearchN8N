import { NodeConnectionTypes, NodeOperationError, OperationalError, UserError } from 'n8n-workflow';
import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';

const searchTypes = ['search', 'images', 'news', 'maps', 'places', 'videos'];
const timeRanges = ['h', 'd', 'w', 'm', 'y', 'qdr:h', 'qdr:d', 'qdr:w', 'qdr:m', 'qdr:y'];
const imageSizes = ['large', 'medium', 'icon', '2mp', '4mp', '6mp', '8mp', '10mp', '12mp', '15mp', '20mp', '40mp', '70mp'];

const properties: INodeProperties[] = [
  {
    displayName: 'Query', name: 'query', type: 'string', default: '', required: true,
    description: 'Words to search for, up to 2048 characters',
  },
  {
    displayName: 'Type', name: 'type', type: 'options', default: 'search',
    options: [
      { name: 'Images', value: 'images' },
      { name: 'Maps', value: 'maps' },
      { name: 'News', value: 'news' },
      { name: 'Places', value: 'places' },
      { name: 'Videos', value: 'videos' },
      { name: 'Web', value: 'search' },
    ],
    description: 'Kind of Google result to return',
  },
  {
    displayName: 'Number of Results', name: 'number', type: 'number', default: 3,
    typeOptions: { minValue: 1, maxValue: 100 },
    description: 'Results per page, from 1 to 100',
  },
  {
    displayName: 'Page', name: 'page', type: 'number', default: 1,
    typeOptions: { minValue: 1, maxValue: 100 },
    description: 'Result page, from 1 to 100',
  },
  {
    displayName: 'Country', name: 'country', type: 'string', default: '',
    description: 'Optional country code, for example us or jp',
  },
  {
    displayName: 'Language', name: 'language', type: 'string', default: '',
    description: 'Optional language code, for example en or ja',
  },
  {
    displayName: 'Time Range', name: 'range', type: 'options', default: '',
    displayOptions: { show: { type: ['search', 'news'] } },
    options: [
      { name: 'Any Time', value: '' },
      { name: 'Past Day', value: 'd' },
      { name: 'Past Hour', value: 'h' },
      { name: 'Past Month', value: 'm' },
      { name: 'Past Week', value: 'w' },
      { name: 'Past Year', value: 'y' },
    ],
    description: 'Limit web or news results by date',
  },
  {
    displayName: 'Image Size', name: 'imageSize', type: 'options', default: '',
    displayOptions: { show: { type: ['images'] } },
    options: [
      { name: 'Any Size', value: '' },
      { name: 'Large', value: 'large' },
      { name: 'Medium', value: 'medium' },
      { name: 'Icon', value: 'icon' },
      ...imageSizes.slice(3).map((size) => ({ name: size.toUpperCase(), value: size })),
    ],
    description: 'Filter image results by image size',
  },
];

function text(value: unknown, label: string, maximum: number, required = false): string {
  if (typeof value !== 'string' || (required && !value.trim()) || value.length > maximum)
    throw new UserError(`${label} must be ${required ? 'nonempty and ' : ''}at most ${maximum} characters`);
  return value.trim();
}

function number(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 100)
    throw new UserError(`${label} must be an integer from 1 to 100`);
  return value;
}

export function searchBody(get: (name: string) => unknown): IDataObject {
  const type = text(get('type'), 'Type', 20, true);
  if (!searchTypes.includes(type)) throw new UserError('Select a supported search type');
  const body: IDataObject = {
    query: text(get('query'), 'Query', 2048, true),
    type,
    number: number(get('number'), 'Number of Results'),
    page: number(get('page'), 'Page'),
  };
  for (const field of ['country', 'language']) {
    const value = text(get(field), field, 32);
    if (value) body[field] = value;
  }
  if (type === 'search' || type === 'news') {
    const range = text(get('range'), 'Time Range', 10);
    if (range && !timeRanges.includes(range)) throw new UserError('Select a supported time range');
    if (range) body.range = range;
  }
  if (type === 'images') {
    const size = text(get('imageSize'), 'Image Size', 10);
    if (size && !imageSizes.includes(size)) throw new UserError('Select a supported image size');
    if (size) body.image_size = size;
  }
  return body;
}

function requestFailure(error: unknown): OperationalError | UserError {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (/credential/.test(message) && /(not found|not set|missing|not configured|not available|required)/.test(message))
    return new UserError('A Google Search by AceDataCloud credential is required.');
  const code = error && typeof error === 'object'
    ? String((error as { httpCode?: unknown; statusCode?: unknown }).httpCode
      ?? (error as { statusCode?: unknown }).statusCode ?? '')
    : '';
  const status = /^\d{3}$/.test(code) ? code : '';
  return new OperationalError(status
    ? `AceDataCloud search returned HTTP ${status}. Check service access and request history before retrying.`
    : 'AceDataCloud search did not complete. Check request history before retrying; the first request may have been charged.');
}

export class GoogleSearch implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Google Search by AceDataCloud',
    name: 'googleSearch',
    icon: { light: 'file:icon.svg', dark: 'file:icon.dark.svg' },
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["type"]}}',
    description: 'Search Google web, images, news, maps, places or videos through AceDataCloud',
    defaults: { name: 'Google Search by AceDataCloud' },
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    usableAsTool: true,
    credentials: [{ name: 'aceDataGoogleSearchApi', required: true }],
    properties,
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const results: INodeExecutionData[] = [];
    for (let index = 0; index < this.getInputData().length; index++) {
      try {
        try {
          const credentials = await this.getCredentials('aceDataGoogleSearchApi');
          if (typeof credentials.apiToken !== 'string' || !credentials.apiToken.trim())
            throw new UserError('Missing API token');
        } catch {
          throw new NodeOperationError(this.getNode(), 'A Google Search by AceDataCloud credential is required.');
        }
        const body = searchBody((name) => this.getNodeParameter(name, index, ''));
        let response: unknown;
        try {
          response = await this.helpers.httpRequestWithAuthentication.call(this, 'aceDataGoogleSearchApi', {
            method: 'POST',
            url: 'https://api.acedata.cloud/serp/google',
            body,
            json: true,
            disableFollowRedirect: true,
            timeout: 60000,
          });
        } catch (error) {
          throw requestFailure(error);
        }
        if (!response || typeof response !== 'object' || Array.isArray(response))
          throw new OperationalError('The service returned an unexpected result');
        const result = response as IDataObject;
        if (result.success === false || result.error)
          throw new OperationalError('Search failed. Check the original request and trace ID before retrying.');
        results.push({ json: result, pairedItem: { item: index } });
      } catch (error) {
        if (!this.continueOnFail())
          throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: index });
        results.push({ json: { error: (error as Error).message }, pairedItem: { item: index } });
      }
    }
    return [results];
  }
}
