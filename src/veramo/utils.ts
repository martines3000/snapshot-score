import { VerifiableCredential } from '@veramo/core';
import { agent } from '../veramo/agent';
import { EthrDID } from 'ethr-did';
import { Resolver } from 'did-resolver';
import { getResolver } from 'ethr-did-resolver';

import { decodeJwt, JWTPayload } from 'jose';

const didResolver = new Resolver(
  getResolver({
    rpcUrl: 'https://rinkeby.infura.io/v3/213be20ed53945018f03b028b68556bb',
    name: 'rinkeby',
  })
);

import Ajv from 'ajv';
const ajv = new Ajv({ allowUnionTypes: true, strict: false });
import addFormats from 'ajv-formats';

addFormats(ajv);

const schemaEIP712 = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://beta.api.schemas.serto.id/v1/public/program-completion-certificate/1.0/json-schema.json',
  title: 'Program Completion Certificate',
  $metadata: {
    slug: 'program-completion-certificate',
    version: '1.0',
    icon: '🎓',
    discoverable: true,
    uris: {
      jsonLdContextPlus:
        'https://beta.api.schemas.serto.id/v1/public/program-completion-certificate/1.0/ld-context-plus.json',
      jsonLdContext: 'https://beta.api.schemas.serto.id/v1/public/program-completion-certificate/1.0/ld-context.json',
      jsonSchema: 'https://beta.api.schemas.serto.id/v1/public/program-completion-certificate/1.0/json-schema.json',
    },
  },
  description: 'The subject of this credential has successfully completed a program or accomplishment.',
  type: 'object',
  required: ['@context', 'type', 'credentialSubject'],
  properties: {
    '@context': { type: ['string', 'array', 'object'] },
    id: { type: 'string', format: 'uri' },
    type: { type: ['string', 'array'], items: { type: 'string' } },
    iss: {
      type: ['string', 'object'],
      format: 'uri',
      required: ['id'],
      properties: { id: { type: 'string', format: 'uri' } },
    },
    issuanceDate: { type: 'string', format: 'date-time' },
    expirationDate: { type: 'string', format: 'date-time' },
    credentialSubject: {
      type: 'object',
      required: ['accomplishmentType', 'learnerName', 'achievement', 'courseProvider'],
      properties: {
        id: { title: 'Credential Subject ID', type: 'string', format: 'uri' },
        accomplishmentType: {
          title: 'Accomplishment Type',
          description: '',
          type: 'string',
        },
        learnerName: { title: 'Learner Name', description: '', type: 'string' },
        achievement: { title: 'Achievement', description: '', type: 'string' },
        courseProvider: {
          title: 'Course Provider',
          description: '',
          type: 'string',
          format: 'uri',
        },
      },
    },
    credentialSchema: {
      type: 'object',
      required: ['id', 'type'],
      properties: {
        id: { type: 'string', format: 'uri' },
        type: { type: 'string' },
      },
    },
  },
};

const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://beta.api.schemas.serto.id/v1/public/program-completion-certificate/1.0/json-schema.json',
  title: 'Program Completion Certificate',
  $metadata: {
    slug: 'program-completion-certificate',
    version: '1.0',
    icon: '🎓',
    discoverable: true,
    uris: {
      jsonLdContextPlus:
        'https://beta.api.schemas.serto.id/v1/public/program-completion-certificate/1.0/ld-context-plus.json',
      jsonLdContext: 'https://beta.api.schemas.serto.id/v1/public/program-completion-certificate/1.0/ld-context.json',
      jsonSchema: 'https://beta.api.schemas.serto.id/v1/public/program-completion-certificate/1.0/json-schema.json',
    },
  },
  description: 'The subject of this credential has successfully completed a program or accomplishment.',
  type: 'object',
  required: ['@context', 'type', 'issuer', 'issuanceDate', 'credentialSubject'],
  properties: {
    '@context': { type: ['string', 'array', 'object'] },
    id: { type: 'string', format: 'uri' },
    type: { type: ['string', 'array'], items: { type: 'string' } },
    issuer: {
      type: ['string', 'object'],
      format: 'uri',
      required: ['id'],
      properties: { id: { type: 'string', format: 'uri' } },
    },
    issuanceDate: { type: 'string', format: 'date-time' },
    expirationDate: { type: 'string', format: 'date-time' },
    credentialSubject: {
      type: 'object',
      required: ['id', 'accomplishmentType', 'learnerName', 'achievement', 'courseProvider'],
      properties: {
        id: { title: 'Credential Subject ID', type: 'string', format: 'uri' },
        accomplishmentType: {
          title: 'Accomplishment Type',
          description: '',
          type: 'string',
        },
        learnerName: { title: 'Learner Name', description: '', type: 'string' },
        achievement: { title: 'Achievement', description: '', type: 'string' },
        courseProvider: {
          title: 'Course Provider',
          description: '',
          type: 'string',
          format: 'uri',
        },
      },
    },
    credentialSchema: {
      type: 'object',
      required: ['id', 'type'],
      properties: {
        id: { type: 'string', format: 'uri' },
        type: { type: 'string' },
      },
    },
  },
};

const resolveDidEthr = async (mmAddr: string, delAddr: string) => {
  console.log('Resolving didEthr', delAddr);
  const chainNameOrId = 'rinkeby';
  const ethrDid = new EthrDID({
    identifier: mmAddr as string,
    chainNameOrId,
  });
  const didDocument = (await didResolver.resolve(ethrDid.did)).didDocument;
  console.log('DID:ETHR DID DOCUMENT:', didDocument);

  const veriKeys = didDocument?.verificationMethod;
  let retVal = false;
  if (veriKeys != null) {
    console.log('veri keys', veriKeys);
    veriKeys.map((key) => {
      if (
        key.blockchainAccountId?.split(':')[2].toUpperCase().substring(0, 42) === delAddr.toUpperCase().substring(0, 42)
      ) {
        retVal = true;
      }
    });
  }
  return retVal;
};

export const verifyVP = async (address: string, vp: any, requiredIssuer: string): Promise<boolean> => {
  try {
    if (vp.proof.type && vp.proof.type == 'JwtProof2020') {
      console.log('VP is type: JWT');

      const res = await agent.verifyPresentation({
        presentation: vp,
        domain: 'did:ethr:rinkeby:0x0241abd662da06d0af2f0152a80bc037f65a7f901160cfe1eb35ef3f0c532a2a4d',
        challenge: 'key123',
      });

      if (res) {
        console.log('Verifiyng VCs');
        if (vp.verifiableCredential) {
          const unresolved: Array<Promise<boolean>> = vp.verifiableCredential?.map(async (_vc): Promise<boolean> => {
            const vc = _vc as VerifiableCredential;
            console.log('=================VERIFYING VC=================', vc);

            // 1. Check if JWT is valid
            const res = await agent.verifyCredential({ credential: vc });
            console.log(res);
            if (!res) return false;
            console.log('Valid JWT proof');
            // 2. Check if VC uses the correct schema
            const validate = ajv.compile(schema);
            if (validate(vc)) {
              console.log('Schema is Valid');
            } else {
              console.log(validate.errors);
              return false;
            }
            const issuer = JSON.parse(JSON.stringify(vc.issuer));
            // 3. verify if JWT content == VC content
            const decoded: JWTPayload = decodeJwt(vc.proof.jwt);

            if (
              decoded.sub != vc.credentialSubject.id ||
              decoded.iss != issuer.id ||
              (decoded as any).vc.credentialSubject.accomplishmentType != vc.credentialSubject.accomplishmentType ||
              (decoded as any).vc.credentialSubject.achievement != vc.credentialSubject.achievement
            ) {
              console.log('VC content is not the same as JWT');
              return false;
            }
            console.log('VC content valid');
            // 4. verify if subject == wallet connected to the dApp
            if (vc.credentialSubject.id?.split(':')[3].toLowerCase() != address.toLowerCase()) {
              console.log('VC does not belong to the address');
              return false;
            }
            console.log('Valid subject');
            // 5. verify issuer
            if (issuer.id.toLowerCase() !== requiredIssuer.toLowerCase()) {
              console.log('failed to verify issuer');
              return false;
            }
            console.log('Issuer valid');
            // 6. verify VP holder
            if (vp.holder.toLowerCase() != vc.credentialSubject.id.toLowerCase()) {
              // 6.1. verify if delegate exists
              if (
                vc.credentialSubject.id &&
                (await resolveDidEthr(vc.credentialSubject.id?.split(':')[3], vp.holder.split(':')[3]))
              )
                console.log('Valid');
              else {
                console.log('Holder does not have authorization to use VC!');
                return false;
              }
            }
            console.log('Valid VP issuer');
            return true;
          });
          const resolved = await Promise.all(unresolved);
          console.log('Finished, VP contains valid VC: ', resolved.includes(true), resolved);
          return resolved.includes(true);
        } else return false;
      } else return false;
    } //EIP712
    else if (vp.proof.type && vp.proof.type == 'EthereumEip712Signature2021') {
      console.log('VP is type EIP712');

      const res = await agent.verifyPresentationEIP712({
        presentation: vp,
      });
      if (res) {
        console.log('Verifiyng VCs');
        if (vp.verifiableCredential) {
          const unresolved: Array<Promise<boolean>> = vp.verifiableCredential?.map(async (_vcJwt): Promise<boolean> => {
            const vcJwt = _vcJwt as string;
            console.log('=================VERIFYING VC=================', vcJwt);

            //0. Decode JWT
            const vc = decodeJwt(vcJwt) as VerifiableCredential;
            console.log('VC: ', vc);
            // 1. Check if JWT is valid
            const res = await agent.verifyCredential({ credential: vcJwt });
            console.log(res);
            if (!res) return false;
            console.log('Valid JWT proof');
            // 2. Check if VC uses the correct schema
            const validate = ajv.compile(schemaEIP712);
            if (validate(vc.vc)) {
              console.log('Schema is Valid');
            } else {
              console.log(validate.errors);
              return false;
            }
            // 3. verify if JWT content == VC content
            // const decoded: JWTPayload = decodeJwt(vc.proof.jwt);

            // if (
            //   decoded.sub != vc.credentialSubject.id ||
            //   decoded.iss != issuer.id ||
            //   (decoded as any).vc.credentialSubject.accomplishmentType !=
            //     vc.credentialSubject.accomplishmentType ||
            //   (decoded as any).vc.credentialSubject.achievement !=
            //     vc.credentialSubject.achievement
            // ) {
            //   console.log("VC content is not the same as JWT");
            //   return false;
            // }
            console.log('VC content valid');
            // 4. verify if subject == wallet connected to the dApp
            if (vc.sub.split(':')[3].toUpperCase() != address.toUpperCase()) {
              console.log(vc.sub.split(':')[3].toUpperCase(), address.toUpperCase());
              console.log('VC does not belong to the address');
              return false;
            }
            console.log('Valid subject');
            // 5. verify issuer
            if (vc.iss.toUpperCase() !== requiredIssuer.toUpperCase()) {
              console.log('failed to verify issuer');
              return false;
            }
            console.log('Issuer valid');
            // 6. verify VP holder
            if (vp.holder.toUpperCase() != vc.sub.toUpperCase()) {
              console.log('Vp holder is not the same as VC subject');
              // 6.1. verify if delegate exists
              if (vc.sub && (await resolveDidEthr(vc.sub.split(':')[3], vp.holder.split(':')[3]))) console.log('Valid');
              else {
                console.log('Holder does not have authorization to use VC!');
                return false;
              }
            }
            console.log('Valid VP issuer');
            return true;
          });
          const resolved = await Promise.all(unresolved);
          console.log('Finished, VP contains valid VC: ', resolved.includes(true), resolved);
          return resolved.includes(true);
        } else return false;
      } else return false;
    }
    return false;
  } catch (err) {
    console.log(err);
    return false;
  }
};
