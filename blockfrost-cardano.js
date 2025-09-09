import { BlockFrostAPI } from '@blockfrost/blockfrost-js';


async function run()
{
  const API = new BlockFrostAPI({
    projectId: 'mainnetENrSA2ctuBd7j6QYB3hG3NxKKzyZhdfa', // see: https://blockfrost.io
  });
  try {
    const latestBlock = await API.blocksLatest();
    const networkInfo = await API.network();
    const latestEpoch = await API.epochsLatest();
    const health = await API.health();
    const address = await API.addresses(
      'addr1q98ztnjfnwzyzakpcany4n60s76jy58k9hdde4sl68jyahexj04qy6cdqd5yktnvkytplxppw8a30tm0cu84kq8nymgssw53ld',
    );
    const pools = await API.pools({ page: 1, count: 10, order: 'asc' });

    console.log('pools', pools);
    console.log('address', address);
    console.log('networkInfo', networkInfo);
    console.log('latestEpoch', latestEpoch);
    console.log('latestBlock', latestBlock);
    console.log('health', health);
  } catch (err) {
    console.log('error', err);
  }
}

run()