// block.js
function getModule(context, config) {
  var
    path = require("path"),
    fs = require("fs"),
    // from context:
    utils = context.utils(),
    transaction = context.transaction(),
    // will contain all blocks mined
    blockChain = [],
    // return the next available index for a block
    getNextIndex = function() {
      return blockChain.length;
    },
    // return the hash from the block previous to idx
    getPreviousHash = function(idx) {
      return idx ? blockChain[idx-1].hash : '';
    },
    // get all block hashes on blockchain
    getBlockHashes = function() {
      return blockChain.reduce(function(acc, block) {
        acc.push(
          block.hash
        );
        return acc;
      }, []);
    },
    // get the block from the blockchain @ index
    getBlockByIndex = function(index) {
      return (
        (index < blockChain.length)
          ? result = blockChain[index]
          : null
      );
    },
    // calculate and return the balance of the user with passed identity.publicKey
    getUserBalance = function(userIdentity) {
      return blockChain.reduce(function(total, block) {
        var
          userPublicKey = userIdentity.keys.publicKey,
          transactions = block.data.transactions;
        //console.log("getUserBalance", "transactions", transactions);
        transactions.forEach(function(txn) {
          txn.txIns.forEach(function(txIn) {
            //console.log("txIn", txIn);
            if (txIn.address === userPublicKey) {
              total -= txIn.amount;
            }
          });
          txn.txOuts.forEach(function(txOut) {
            //console.log("txOut", txOut);
            if (txOut.address === userPublicKey) {
              total += txOut.amount;
            }
          });
        });
        //console.log("getUserBalance", userIdentity, total, block);
        return total;
      }, 0);
    },
    resetBlockChain = function() {
      transaction.resetTransactions();
      blockChain = [];
      return blockChain;
    },
    submitNewBlock = function(newBlock) {
      blockChain.push(newBlock);
      transaction.updateUnspentTxOuts(newBlock.data.transactions, newBlock.index);
    },
    
    // ensure paths
    dataPath = path.resolve(config.path, config.data.path),
    ensureDataPath = utils.checkDir(dataPath) || fs.mkdirSync(dataPath),
    blockPath = path.resolve(dataPath, './block'),
    ensureBlockPath = utils.checkDir(blockPath) || fs.mkdirSync(blockPath),
    
    // the block API
    blockAPI = {
      "getNextIndex": getNextIndex,
      "getPreviousHash": getPreviousHash,
      "getBlockHashes": getBlockHashes,
      "getBlockByIndex": getBlockByIndex,
      "getUserBalance": getUserBalance,
      "resetBlockChain": resetBlockChain,
      "submitNewBlock": submitNewBlock
    };
  return blockAPI;
}

module.exports = {
  "require": ["utils", "transaction"],
  "init": function(context, config) {
    return getModule(context, config);
  }
};
