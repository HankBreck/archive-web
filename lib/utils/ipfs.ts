import { create, IPFS } from 'ipfs-core'
import { concat, toString } from "uint8arrays"

let ipfs: IPFS

export const getIPFSClient = async () => {
  if (!ipfs) {
    ipfs = await create()
  }
  return ipfs
}

export const getFileContents = async (cid: string) => {
  const source = ipfs.cat(cid)
  let bytes: Uint8Array[] = []
  let i = 0
  for await (const chunk of source) {
      bytes.push(chunk)
      i += 1
  }
  return toString(concat(bytes))
}

const config = {
  Addresses: {
    Swarm: [
    ],
    Announce: [],
    NoAnnounce: [],
    API: process.env.NODE_ENV === "production" 
          ? process.env.IPFS_API_URI 
          : process.env.IPFS_DEV_API_URI,
    Gateway: '',
    RPC: '',
    Delegates: [
      '/dns4/node0.delegate.ipfs.io/tcp/443/https',
      '/dns4/node1.delegate.ipfs.io/tcp/443/https',
      '/dns4/node2.delegate.ipfs.io/tcp/443/https',
      '/dns4/node3.delegate.ipfs.io/tcp/443/https'
    ]
  },
  Discovery: {
    MDNS: {
      Enabled: false,
      Interval: 10
    },
    webRTCStar: {
      Enabled: true
    }
  },
  Bootstrap: [
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmZa1sAxajnQjVM8WjWXoMbmPd7NsWhfKsPkErzpm9wGkp',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt',
    '/dns4/node0.preload.ipfs.io/tcp/443/wss/p2p/QmZMxNdpMkewiVZLMRxaNxUeZpDUb34pWjZ1kZvsd16Zic',
    '/dns4/node1.preload.ipfs.io/tcp/443/wss/p2p/Qmbut9Ywz9YEDrz8ySBSgWyJk41Uvm2QJPhwDJzJyGFsD6',
    '/dns4/node2.preload.ipfs.io/tcp/443/wss/p2p/QmV7gnbW5VTcJ3oyM2Xk1rdFBJ3kTkvxc87UFGsun29STS',
    '/dns4/node3.preload.ipfs.io/tcp/443/wss/p2p/QmY7JB6MQXhxHvq7dBDh4HpbH29v4yE9JRadAVpndvzySN'
  ],
  Pubsub: {
    Enabled: true
  },
  Swarm: {
    ConnMgr: {
      LowWater: 5,
      HighWater: 20
    },
    DisableNatPortMap: true
  },
  Routing: {
    Type: 'dhtclient'
  }
}