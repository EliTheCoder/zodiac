const SHA256 = require("crypto-js/SHA256");

class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.nonce = 0;
    this.previousHash = previousHash;
    this.hash = '';
  }
  mine() {
    let solved = false;
    let nonce = 0;
    let hash;
    while (!solved) {
      let hashAttempt = SHA256(this.index + this.previousHash + this.timestamp + this.nonce + JSON.stringify(this.data)).toString();
      if (hashAttempt.startsWith("000")) {
        solved = true;
        hash = hashAttempt;
      } else {
        this.nonce++;
      }
    }
    this.hash = hash;
    return {
      hash: hash,
      nonce: this.nonce
    };
  }
}

class Bridge {
  constructor(username, publicKey) {
    this.username = username;
    this.publicKey = publicKey;
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
  }

  createGenesisBlock() {
    let genesis = new Block(0, new Date(), "Genesis");
    genesis.mine();
    return genesis;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(newBlock) {
    newBlock.previousHash = this.getLatestBlock().hash;
    this.chain.push(newBlock);
  }

  verify() {
    let bridges = {};
    for (let i = 0; i < this.chain.length - 1; i++) {
      const currentBlock = this.chain[i];
      const calculatedHash = SHA256(currentBlock.index + currentBlock.previousHash + currentBlock.timestamp + currentBlock.nonce + JSON.stringify(currentBlock.data)).toString();
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== calculatedHash) {
        return {
          integrity: false,
          discrepancy: `zodiac block ${currentBlock.index}: hash is incorrect`
        };
      }

      if (currentBlock.data.bridges) {
        /* jshint ignore:start */
        currentBlock.data.bridges.forEach(bridge => {
          if (bridges[bridge.username]) {
            return {
              integrity: false,
              discrepancy: `zodiac block ${currentBlock.index}: username "${bridge.username}" previously bridged in zodiac block ${bridges[bridge.username].block}`
            }
          } else {
            bridge[bridge.username] = {
              publicKey: bridge.publicKey,
              block: currentBlock.index
            }
          }
        });
        /* jshint ignore:end */
      }

      if (!currentBlock.hash.startsWith("000")) {
        return {
          integrity: false,
          discrepancy: `zodiac block ${currentBlock.index}: hash is not mined`
        };
      }

      if (currentBlock.index === 0) return {
        integrity: true
      };

      if (currentBlock.previousHash !== previousBlock.hash) {
        return {
          integrity: false,
          discrepancy: `zodiac block ${currentBlock.index}: previous hash is incorrect`
        };
      }
    }
  }
}

let zodiac = new Blockchain();
zodiac.addBlock(new Block(zodiac.getLatestBlock().index + 1, new Date(), {
  amount: 10
}));

console.log(zodiac.chain);

console.log(zodiac.verify());
