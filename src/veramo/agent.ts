// Core interfaces
import { createAgent, IMessageHandler, IResolver } from '@veramo/core';
import { CredentialIssuer, ICredentialIssuer } from '@veramo/credential-w3c';
// Custom resolvers
import { DIDResolverPlugin } from '@veramo/did-resolver';
import { Resolver } from 'did-resolver';
import { getResolver as ethrDidResolver } from 'ethr-did-resolver';

// You will need to get a project ID from infura https://www.infura.io
const INFURA_PROJECT_ID = 'da2069d93bdf491f992fb8cae21ba41b';

export const agent = createAgent<IResolver & ICredentialIssuer>({
  plugins: [
    new CredentialIssuer(),
    new DIDResolverPlugin({
      resolver: new Resolver({
        ...ethrDidResolver({ infuraProjectId: INFURA_PROJECT_ID })
      })
    })
  ]
});
