// TEST block.js
var 
  data = {
    "genesis": {
      "data": "The genesis block..."
    },
    "first": {
      "data": "The first block..."
    },
    "second": {
      "data": "The second block..."
    }
  },
  difficulty = 1, // NOTE: don't set this too high...lol... or you'll really be mining :)
  tests = {
    "sync test chain.block.create()": function(test, chain) {
      Object.keys(data).forEach(function(key, idx) {
        test.startTime();
        var 
          max_digits = 15,
          random_number = Math.floor(Math.random() * max_digits) - max_digits,
          random_nonce = parseInt(
            ((Math.random() + "").replace(".", "").slice(random_number))
          ),
          blockData = chain.block.create(
            data[key], difficulty++, random_nonce
          ),
          block = blockData.newBlock;
        test.endTime();
        test.assert.identical(
          JSON.stringify(data[key]), 
          JSON.stringify(block.data)
        );
        test.assert.identical(
          idx, 
          block.index
        );
        console.log(idx, key, blockData);
      });
      test.done();
    }
  };

module.exports = tests;