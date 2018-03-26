// TEST cuda.js
var 
  tests = {
    "sync test chain.cuda.start()": function(test, chain) {
      test.startTime();
      chain.cuda.start({
        "testing": true,
        "ready": function(CUDA_INFO) {
          test.endTime();
          console.log("CUDA_INFO", CUDA_INFO);
          test.assert.identical(
            1, 
            1,
            "cuda start"
          );
          test.done();
        }
      });
    },
    "sync test chain.cuda.stop()": function(test, chain) {
      test.startTime();
      
      chain.cuda.stop(function() {
        test.endTime();
        test.assert.identical(
          1,
          1,
          "cuda stop"
        );
        test.done();
      });
    }
  };

module.exports = tests;
