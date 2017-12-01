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
    "create": function(data) {
      var
        index = getNextIndex(),
        previousHash = getPreviousHash(index),
        timestamp = getTimeStamp(),
        newBlock = {
          "data": data,
          "index": index,
          "previousHash": previousHash,
          "timestamp": timestamp
        };
      newBlock.hash = getBlockHash(newBlock);
      blockChain.push(newBlock);
      return newBlock;
    }
  };

module.exports = block;
