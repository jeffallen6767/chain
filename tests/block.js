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
    },
    "third": {
      "data": "The third block..."
    },
  },
  difficulty = 1, // NOTE: don't set this too high...lol... or you'll really be mining :)
  tests = {
    "sync test chain.block.create()": function(test, chain) {
      Object.keys(data).forEach(function(key, idx) {
        test.startTime();
        var 
          random_nonce = parseInt(
            ((Math.random() + "").replace(".", "").slice(-15))
          ),
          block = chain.block.create(
            data[key], difficulty++, random_nonce
          );
        console.log(idx, key, block);
        test.endTime();
        test.assert.identical(
          JSON.stringify(data[key]), 
          JSON.stringify(block.data)
        );
        test.assert.identical(
          idx, 
          block.index
        );
      });
      test.done();
    }
  };

module.exports = tests;