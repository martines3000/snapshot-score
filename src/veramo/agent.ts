// Core interfaces
import { createAgent, IResolver } from '@veramo/core';
import { CredentialIssuer, ICredentialIssuer } from '@veramo/credential-w3c';
// Custom resolvers
import { DIDResolverPlugin } from '@veramo/did-resolver';
import { Resolver } from 'did-resolver';
import { getResolver as ethrDidResolver } from 'ethr-did-resolver';
import {
  CredentialIssuerLD,
  ICredentialIssuerLD,
  LdDefaultContexts,
  VeramoEcdsaSecp256k1RecoverySignature2020,
  VeramoEd25519Signature2018,
} from '@veramo/credential-ld';

import { CredentialIssuerEIP712, ICredentialIssuerEIP712 } from '@veramo/credential-eip712';

// You will need to get a project ID from infura https://www.infura.io
const INFURA_PROJECT_ID = 'da2069d93bdf491f992fb8cae21ba41b';

export const agent = createAgent<IResolver & ICredentialIssuer & ICredentialIssuerEIP712 & ICredentialIssuerLD>({
  plugins: [
    new CredentialIssuer(),
    new CredentialIssuerEIP712(),
    new CredentialIssuerLD({
      contextMaps: [LdDefaultContexts],
      suites: [new VeramoEd25519Signature2018(), new VeramoEcdsaSecp256k1RecoverySignature2020()],
    }),
    new DIDResolverPlugin({
      resolver: new Resolver({
        ...ethrDidResolver({ infuraProjectId: INFURA_PROJECT_ID }),
      }),
    }),
  ],
});
