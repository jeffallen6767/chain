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
  tests = {
    "sync test chain.block.create()": function(test, chain) {
      Object.keys(data).forEach(function(key, idx) {
        test.startTime();
        var 
          block = chain.block.create(
            data[key]
          );
        //console.log(idx, key, block);
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