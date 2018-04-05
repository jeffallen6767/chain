// TEST opencl.js
var 
  tests = {
    "sync test chain.opencl.test()": function(test, chain) {
      test.startTime();
      chain.opencl.test({
        "testing": true,
        "ready": function() {
          test.endTime();
          test.assert.identical(
            1, 
            1,
            "opencl test"
          );
          test.done();
        }
      });
    }
  };

module.exports = tests;
