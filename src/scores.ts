import events from 'events';
import snapshot from '@snapshot-labs/strategies';
import { get, set } from './aws';
import { paginateStrategies, sha256 } from './utils';
import getProvider from './provider';
import { verifyVP } from './veramo/utils';

const eventEmitter = new events.EventEmitter();
// https://stackoverflow.com/a/26176922
eventEmitter.setMaxListeners(1000);
export const blockNumByNetwork = {};
const blockNumByNetworkTs = {};
const delay = 30;
const withCache = !!process.env.AWS_REGION;

async function getBlockNum(network) {
  const ts = parseInt((Date.now() / 1e3).toFixed());
  if (blockNumByNetwork[network] && blockNumByNetworkTs[network] > ts - delay) return blockNumByNetwork[network];

  const provider = getProvider(network);
  const blockNum = await provider.getBlockNumber();

  blockNumByNetwork[network] = blockNum;
  blockNumByNetworkTs[network] = ts;

  return blockNum;
}
const issuer = 'did:ethr:rinkeby:0x0241abd662da06d0af2f0152a80bc037f65a7f901160cfe1eb35ef3f0c532a2a4d';

async function calculateScores(parent, args, key) {
  const { space = '', strategies, network, addresses, vps } = args;

  console.log('Request:', space, network, JSON.stringify(parent.strategyNames), key, parent.requestId);

  let snapshotBlockNum = 'latest';
  if (args.snapshot !== 'latest') {
    const currentBlockNum = await getBlockNum(network);
    snapshotBlockNum = currentBlockNum < args.snapshot ? 'latest' : args.snapshot;
  }

  const state = snapshotBlockNum === 'latest' ? 'pending' : 'final';
  let scores;

  if (withCache && state === 'final') scores = await get(key);

  let cache = true;
  if (!scores) {
    cache = false;

    /*
      Verify Verifiable presentations and return score
    */
    scores = [
      Object.fromEntries(
        await Promise.all(
          addresses.map(async (address, i) => {
            let res = await verifyVP(address, vps[i], issuer);
            return [address, res ? 1 : 0];
          })
        )
      )
    ];
    // scores.push({}); // FIXME: NEED AND EMPTY ONE BECUASE NUMBER OF STRATEGIES IS 2 and we have only 1 VP
    // console.log(scores);

    // const strategiesWithPagination = paginateStrategies(space, network, strategies);

    // scores = await snapshot.utils.getScoresDirect(
    //   space,
    //   strategiesWithPagination,
    //   network,
    //   getProvider(network),
    //   addresses,
    //   snapshotBlockNum
    // );

    if (withCache && state === 'final') {
      set(key, scores).then(() => {
        // console.log('Stored!');
      });
    }
  }

  return {
    state,
    cache,
    scores
  };
}

export default async function scores(parent, args) {
  const key = sha256(JSON.stringify(args));
  // console.log('Key', key, JSON.stringify({ space, strategies, network }), addresses.length);

  return new Promise(async (resolve, reject) => {
    // Wait for scores to be calculated
    eventEmitter.once(key, data => (data.error ? reject(data.e) : resolve(data)));
    // If this request is the first one, calculate scores
    if (eventEmitter.listenerCount(key) === 1) {
      try {
        const scoresData = await calculateScores(parent, args, key);
        eventEmitter.emit(key, scoresData);
      } catch (e) {
        eventEmitter.emit(key, { error: true, e });
      }
    }
  });
}
