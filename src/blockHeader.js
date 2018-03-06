// blockHeader.js
var
  utils = require("./utils"),
  // create a block header
  create = function(version, previous, merkle, timestamp, difficulty, nonce) {
    var
      blockHeader = {
        "version": version,       // block version
        "previous": previous,     // previous block header hash
        "merkle": merkle,         // merkle root hash of all transactions
        "timestamp": timestamp,   // unix epoch time of creation
        "difficulty": difficulty, // target threshold of block header hash
        "nonce": nonce            // uInt32
      };
    return blockHeader;
  },
  blockHeaderAPI = {
    "create": create
  };

module.exports = blockHeaderAPI;
