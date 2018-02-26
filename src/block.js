var
  hasher = require("./hash").keccak.mode("SHA-3-256"),
  blockChain = [],
  getNextIndex = function() {
    return blockChain.length;
  },
  getPreviousHash = function(idx) {
    return idx ? blockChain[idx-1].hash : null;
  },
  getTimeStamp = function() {
    return new Date().getTime();
  },
  getBlockHash = function(obj) {
    return hasher.init().update(
      JSON.stringify(obj)
    ).digest();
  },
  block = {
    "create": function(data, difficulty, nonce) {
      var
        difficulty = difficulty || 0,
        nonce = nonce || 0,
        mining = difficulty ? true : false,
        index = getNextIndex(),
        previousHash = getPreviousHash(index),
        timestamp = getTimeStamp(),
        newBlock = {
          "data": data,
          "index": index,
          "previousHash": previousHash,
          "timestamp": timestamp,
          "difficulty": difficulty,
          "nonce": nonce
        },
        // force at least one mining message
        lastMsg = timestamp,
        lastVal = 0,
        maxInt = Number.MAX_SAFE_INTEGER;
      
      // set hash
      newBlock.hash = getBlockHash(newBlock);
      
      while (mining) {
        var
          test = newBlock.hash.slice(0, difficulty),
          value = parseInt(test, 16),
          done = value === 0,
          next,
          time, elapsed, perSecond;
        lastVal++;
        if (done) break;
        if (newBlock.nonce === maxInt) {
          newBlock.nonce = 0;
        } else {
          newBlock.nonce++;
        }
        newBlock.hash = getBlockHash(newBlock);
        time = getTimeStamp();
        if (time - lastMsg > 1000) {
          lastMsg = time;
          elapsed = (time - timestamp) / 1000;
          perSecond = Math.round(lastVal / elapsed);
          console.log("mining difficulty", difficulty, "@", perSecond, "/per second", newBlock.hash, newBlock.nonce);
        }
      }
      
      if (mining) {
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
          lastVal, 
          elapsed
        );
      }
      
      blockChain.push(newBlock);
      
      return newBlock;
    }
  };

module.exports = block;
