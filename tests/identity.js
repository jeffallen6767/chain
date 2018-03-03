// TEST identity.js
var 
  /*
  data = {
    "jeff allen": {
      "data": "The secret of my identity should be a bunch of words?"
    }
  },
  */
  data = {
    "data": {
      "name": "jeff allen",
      "secret": "The secret of my identity should be a bunch of words?"
    }
  },
  tests = {
    "sync test chain.identity.create()": function(test, chain) {
      test.startTime();
      var 
        identity = chain.identity.create(
          data
        );
      test.endTime();
      // test that privateKey contains publicKey
      test.assert.identical(
        identity.publicKey,
        identity.privateKey.slice(64),
        "test that privateKey contains publicKey"
      );
      test.done();
    }
  };

module.exports = tests;