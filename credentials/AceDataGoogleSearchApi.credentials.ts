import type { IAuthenticateGeneric, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

export class AceDataGoogleSearchApi implements ICredentialType {
  name = 'aceDataGoogleSearchApi';
  displayName = 'Google Search by AceDataCloud API';
  documentationUrl = 'https://github.com/AceDataCloud/GoogleSearchN8N#credentials';
  icon = 'file:../nodes/GoogleSearch/icon.svg' as const;
  properties: INodeProperties[] = [
    {
      displayName: 'API Token',
      name: 'apiToken',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'An AceDataCloud application API token with Google Search access',
    },
  ];
  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: { Authorization: '=Bearer {{$credentials.apiToken}}' },
    },
  };
  test: ICredentialTestRequest = {
    request: { baseURL: 'https://api.acedata.cloud', url: '/openai/models', method: 'GET' },
  };
}
