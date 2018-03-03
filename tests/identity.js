// TEST identity.js
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
        
        test.endTime();
      });
      test.done();
    }
  };

module.exports = tests;