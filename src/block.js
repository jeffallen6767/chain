// block.js
var
  utils = require("./utils"),
  // will contain all blocks mined
  blockChain = [],
  // return the next available index for a block
  getNextIndex = function() {
    return blockChain.length;
  },
  // return the hash from the block previous to idx
  getPreviousHash = function(idx) {
    return idx ? blockChain[idx-1].hash : null;
  },
  /*
  // mine a block
  mineBlock = function(miningData) {
    var
      // number of zeros the hash must start with
      difficulty = miningData.difficulty,
      // the block we're trying to mine
      newBlock = miningData.newBlock,
      // slice off (difficulty) characters from start of hash
      test = newBlock.hash.slice(0, difficulty),
      // parse the slice as a base-16 (hexidecimal) value
      value = parseInt(test, 16),
      // compare result with zero ( zero == done )
      done = value === 0,
      // get the current time
      time = utils.getTimeStamp(),
      // calculate the elapsed time from current - start ( milliseconds )
      elapsed = (time - miningData.timestamp) / 1000,
      // calculate the # of calls to mineBlock per second
      perSecond = Math.round(miningData.miningAttempts / elapsed);
    
    // check to see if we still need to mine...
    if (!done) {
      // increment the number of mining attempts
      miningData.miningAttempts++;
      // have we reached the integer limit for JavaScript?
      if (newBlock.nonce === Number.MAX_SAFE_INTEGER) {
        // start over at zero
        newBlock.nonce = 0;
      } else {
        // increment ( add one ) to the current nonce
        newBlock.nonce++;
      }
      // calculate the new hash ( only nonce has changed )
      newBlock.hash = utils.getObjectHash(newBlock);
      // get the current time
      time = utils.getTimeStamp();
      // has it been at least one second since we last reported?
      if (time - miningData.lastReportTime > 1000) {
        // set the last report time to the current time
        miningData.lastReportTime = time;
        // calculate the elapsed time from current - start ( milliseconds )
        elapsed = (time - miningData.timestamp) / 1000;
        // calculate the # of calls to mineBlock per second
        perSecond = Math.round(miningData.miningAttempts / elapsed);
        // report the current statistics
        //console.log("mining difficulty", difficulty, "@", perSecond, "/per second", newBlock.hash, newBlock.nonce);
      }
    } else {
      // we're done mining...
      
      console.log(
        "BLOCKHASH FOUND!!! mining difficulty", 
        difficulty, 
        "in", 
        elapsed, 
        "seconds @", 
        perSecond, 
        "/per second, hash:", 
        newBlock.hash, 
        "nonce:",
        newBlock.nonce, 
        "miningAttempts:",
        miningData.miningAttempts, 
        "elapsed time:",
        elapsed
      );
      
    }
    
    return done;
  },
  
  // create a block
  create = function(data, difficulty, nonce) {
    var
      // set up the mining difficulty ( number of zeros the hash must start with, zero == none )
      difficulty = difficulty || 0,
      // set up the nonce, a number incremented at each mining attempt ( this alters the resulting hash )
      nonce = nonce || 0,
      // if there's no difficulty, we don't even have to check for a good hash, we can just use whatever
      mining = difficulty ? true : false,
      // get the next available block index
      index = getNextIndex(),
      // get the hash from the previous block ( this new blocks parent )
      previousHash = getPreviousHash(index),
      // get the current time
      timestamp = utils.getTimeStamp(),
      // calculate the transaction data
      transactionData = utils.getTransactionData(data.transactions || []),
      // good transactions ( valid )
      goodTransactionData = transactionData.good,
      // bad transactions ( invalid )
      badTransactionData = transactionData.bad,
      // create the new block object
      newBlock = {
        "index": index,
        "timestamp": timestamp,
        "difficulty": difficulty,
        "previousHash": previousHash,
        "data": data,
        "nonce": nonce
      },
      // set up the mining scratch-pad for the miner
      miningData = {
        difficulty: difficulty,
        timestamp: timestamp,
        lastReportTime: timestamp,
        miningAttempts: 0,
        newBlock: newBlock
      };
    
    // set good transaction data
    data.transactions = goodTransactionData;
    
    // set data
    newBlock.data = data;
    
    // set hash
    newBlock.hash = utils.getObjectHash(newBlock);
    
    // do we still need to mine this block?
    while (mining) {
      // try to mine the block
      if (mineBlock(miningData)) break;
    }
    
    // add the newly mined block to the blockchain
    blockChain.push(newBlock);
    
    return miningData;
  },
  */
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
        userPublicKey = userIdentity.publicKey,
        transactions = block.data.transactions;
      transactions.forEach(function(transaction) {
        if (transaction.payload.sender === userPublicKey) {
          total -= transaction.payload.amount;
        }
        if (transaction.payload.receiver === userPublicKey) {
          total += transaction.payload.amount;
        }
      });
      //console.log("getUserBalance", userIdentity.name, total, block);
      return total;
    }, 0);
  },
  resetBlockChain = function() {
    blockChain = [];
    return blockChain;
  },
  submitNewBlock = function(newBlock) {
    blockChain.push(newBlock);
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

module.exports = blockAPI;
