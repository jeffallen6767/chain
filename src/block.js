// block.js
function getModule(context, config) {
  var
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
      context.transaction.resetTransactions();
      blockChain = [];
      return blockChain;
    },
    submitNewBlock = function(newBlock) {
      blockChain.push(newBlock);
      context.transaction.updateUnspentTxOuts(newBlock.data.transactions, newBlock.index);
    },
    // the block API
    blockAPI = {
      "getNextIndex": getNextIndex,
      "getPreviousHash": getPreviousHash,
      /* "create": create, */
      "getBlockHashes": getBlockHashes,
      "getBlockByIndex": getBlockByIndex,
      "getUserBalance": getUserBalance,
      "resetBlockChain": resetBlockChain,
      "submitNewBlock": submitNewBlock
    };
  return blockAPI;
}

module.exports = {
  "require": ["transaction"],
  "init": function(context, config) {
    return getModule(context, config);
  }
};
