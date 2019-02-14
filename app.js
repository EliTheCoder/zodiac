const SHA256 = require("crypto-js/SHA256");
const eliapi = require("eliapi");

class Block {
  constructor(index, data, timestamp = new Date() / 1, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.nonce = 0;
    this.previousHash = previousHash;
    this.hash = '';
  }
  getData() {
    return this.index + this.previousHash + this.timestamp + JSON.stringify(this.data);
  }
  mine(initialNonce) {
    if (initialNonce) {
      this.nonce = parseInt(initialNonce);
    } else {
      this.nonce = 0;
    }
    let counter = 0;
    let aps = 0;
    let recording = true;
    let solved = false;
    let hash;
    while (!solved) {
      let hashAttempt = SHA256(this.index + this.previousHash + this.timestamp + JSON.stringify(this.data) + this.nonce).toString();
      counter++;
      if (recording) {
        recording = false;
        /* jshint ignore:start */
        setTimeout(() => {
          aps = counter;
          counter = 0;
          recording = true;
        }, 1000);
        /* jshint ignore:end */
      }
      if (this.nonce % 1000 === 0) {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`[zodiac block ${this.index}] mine attempt ${this.nonce}: ${hashAttempt.substring(0,7)} (${aps} attempts per second)`);
      }
      if (hashAttempt.startsWith("0000000")) {
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

class Reward {
  constructor(username, index, nonce) {
    this.username = username;
    this.index = index;
    this.nonce = nonce;
    this.timestamp = new Date() / 1;
  }
}

class Bridge {
  constructor(username, publicKey) {
    this.username = username;
    this.publicKey = publicKey;
  }
}

class Transaction {
  constructor(sender, recipient, amount, signature) {
    this.sender = sender;
    this.recipient = recipient;
    this.amount = amount;
    this.signature = signature;
  }
}

class Blockchain {
  constructor() {
    this.chain = [];
  }

  createGenesisBlock(initialNonce) {
    let genesis = new Block(0, {
      transactions: [],
      bridges: []
    });
    genesis.mine(initialNonce);
    this.addBlock(genesis);
    return genesis;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(newBlock) {
    if (newBlock.index !== 0) newBlock.previousHash = this.getLatestBlock().hash;
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

      if (!currentBlock.hash.startsWith("0000000")) {
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

let genesis = new Block(0, {
  transactions: [],
  bridges: []
}, 1550111997313);
console.log(genesis);
console.log(genesis.getData());
genesis.mine(process.argv[2]);
console.log("\n" + JSON.stringify(genesis));
zodiac.addBlock(genesis);
