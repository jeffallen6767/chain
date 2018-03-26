// TEST openCL.js
var 
  tests = {
    "sync test chain.openCL.test()": function(test, chain) {
      test.startTime();
      chain.openCL.test({
        "testing": true,
        "ready": function() {
          test.endTime();
          test.assert.identical(
            1, 
            1,
            "openCL test"
          );
          test.done();
        }
      });
    }
  };

module.exports = tests;
