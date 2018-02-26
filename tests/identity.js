// tests for identity
var 
  data = {
    "jeff allen": {
      "data": "The secret of my identity should be a bunch of words?"
    }
  },
  tests = {
    "sync test chain.identity.create()": function(test, chain) {
      Object.keys(data).forEach(function(key, idx) {
        test.startTime();
        var 
          identity = chain.identity.create(
            data[key]
          );
        console.log(idx, key, identity);
        test.endTime();
        /*
        test.assert.identical(
          JSON.stringify(data[key]), 
          JSON.stringify(block.data)
        );
        test.assert.identical(
          idx, 
          block.index
        );
        */
      });
      test.done();
    }
  };

module.exports = tests;