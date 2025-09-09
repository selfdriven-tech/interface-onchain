import { BlockFrostIPFS } from '@blockfrost/blockfrost-js';

const IPFS = new BlockFrostIPFS({
  projectId: 'YOUR IPFS KEY HERE', // see: https://blockfrost.io
});

try {
  const added = await IPFS.add(`${__dirname}/img.svg`);
  console.log('added', added);

  const pinned = await IPFS.pin(added.ipfs_hash);
  console.log('pinned', pinned);
} catch (err) {
  console.log('error', err);
}