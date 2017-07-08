var chain = require("./index"),
  tester = require("testing"),
  tests = {
    "sync test chain.hash.sha256('')": function(test) {
      var result = chain.hash.sha256('');
      test.assert.identical(result, "E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855");
      test.done();
    },
    "async test chain.hash.sha256('')": function(test) {
      chain.hash.sha256('', function(result) {
        test.assert.identical(result, "E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855");
        test.done();
      });
    }
  };
tester.run(tests);
/*
console.log("sync test chain.hash.sha256('')", chain.hash.sha256(''));
chain.hash.sha256('', function(result) {
  console.log("async test chain.hash.sha256('')", result);
});
*/