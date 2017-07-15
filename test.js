var chain = require("./index"),
  tester = require("testing"),
  data = {
    "sha256": [
      ["","E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855"],
      ["abc", "BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD"],
      ["abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq", "248D6A61D20638B8E5C026930C3E6039A33CE45964FF2167F6ECEDD419DB06C1"]
    ]
  },
  tests = {
    "sync test chain.hash.sha256()": function(test) {
      data.sha256.forEach(function(pair) {
        var result = chain.hash.sha256(pair[0]);
        test.assert.identical(result, pair[1]);
      });
      test.done();
    },
    "async test chain.hash.sha256()": function(test) {
      data.sha256.forEach(function(pair) {
        chain.hash.sha256(pair[0], function(result) {
          test.assert.identical(result, pair[1]);
        });
      });
      test.done();
    }
  };

tester.run(tests);
