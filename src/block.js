// block.js
var
  utils = require("./utils"),
  blockChain = [],
  getNextIndex = function() {
    return blockChain.length;
  },
  getPreviousHash = function(idx) {
    return idx ? blockChain[idx-1].hash : null;
  },
  mineBlock = function(newBlock, meta) {
    var
      difficulty = meta.difficulty,
      test = newBlock.hash.slice(0, difficulty),
      value = parseInt(test, 16),
      done = value === 0,
      next,
      time, elapsed, perSecond;
    if (!done) {
      meta.lastVal++;
      if (newBlock.nonce === Number.MAX_SAFE_INTEGER) {
        newBlock.nonce = 0;
      } else {
        newBlock.nonce++;
      }
      newBlock.hash = utils.getObjectHash(newBlock);
      time = utils.getTimeStamp();
      if (time - meta.lastMsg > 1000) {
        meta.lastMsg = time;
        elapsed = (time - meta.timestamp) / 1000;
        perSecond = Math.round(meta.lastVal / elapsed);
        console.log("mining difficulty", difficulty, "@", perSecond, "/per second", newBlock.hash, newBlock.nonce);
      }
    } else {
      console.log(
        "BLOCKHASH FOUND!!! mining difficulty", 
        difficulty, 
        "in", 
        elapsed, 
        "seconds @", 
        perSecond, 
        "/per second", 
        newBlock.hash, 
        newBlock.nonce, 
        meta.lastVal, 
        elapsed
      );
    }
    return done;
  },
  block = {
    "create": function(data, difficulty, nonce) {
      var
        difficulty = difficulty || 0,
        nonce = nonce || 0,
        mining = difficulty ? true : false,
        index = getNextIndex(),
        previousHash = getPreviousHash(index),
        timestamp = utils.getTimeStamp(),
        transactionData = utils.getTransactionData(data.transactions || []),
        goodTransactionData = transactionData.good,
        badTransactionData = transactionData.bad,
        newBlock = {
          "data": data,
          "index": index,
          "previousHash": previousHash,
          "timestamp": timestamp,
          "difficulty": difficulty,
          "nonce": nonce
        },
        meta = {
          difficulty: difficulty,
          timestamp: timestamp,
          lastMsg: timestamp,
          lastVal: 0
        };
      
      // set good transaction data
      data.transactions = goodTransactionData;
      newBlock.data = data;
      
      // set hash
      newBlock.hash = utils.getObjectHash(newBlock);
      
      // try to mine the block
      while (mining) {
        done = mineBlock(newBlock, meta);
        if (done) break;
      }
      
      // add the newly mined block to the blockchain
      blockChain.push(newBlock);
      
      return newBlock;
    },
    "getBlockHashes": function() {
      return blockChain.reduce(function(acc, block) {
        acc.push(
          block.hash
        );
        return acc;
      }, []);
    },
    "getBlockByIndex": function(index) {
      var
        result = null;
      if (index < blockChain.length) {
        result = blockChain[index];
      }
      return result;
    },
    "getUserBalance": function(userIdentity) {
      return blockChain.reduce(function(total, block) {
        var
          userPublicKey = userIdentity.publicKey,
          transactions = (block.data && Array.isArray(block.data.transactions) && block.data.transactions) || [];
        transactions.forEach(function(transaction) {
          if (transaction.payload.sender === userPublicKey) {
            total -= transaction.payload.amount;
          }
          if (transaction.payload.receiver === userPublicKey) {
            total += transaction.payload.amount;
          }
        });
        return total;
      }, 0);
    }
  };

module.exports = block;
