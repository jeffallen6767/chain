var chain = require("./index"),
  tester = require("testing"),
  data = {
    "sha256": [
      ["","E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855"],
      ["abc", "BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD"],
      ["abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq", "248D6A61D20638B8E5C026930C3E6039A33CE45964FF2167F6ECEDD419DB06C1"]
    ],
    "keccak": [
      ["","a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a"],
      ["abc", "3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532"],
      ["abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq", "41c0dba2a9d6240849100376a8235e2c82e1b9998a999e21db32dd97496d3376"]
    ]
  },
  tests = {
    "sync test chain.hash.sha256()": function(test) {
      data.sha256.forEach(function(pair) {
        test.startTime();
        var result = chain.hash.sha256(pair[0]);
        test.endTime();
        test.assert.identical(result, pair[1]);
      });
      test.done();
    },
    "async test chain.hash.sha256()": function(test) {
      data.sha256.forEach(function(pair) {
        test.startTime();
        chain.hash.sha256(pair[0], function(result) {
          test.endTime();
          test.assert.identical(result, pair[1]);
        });
      });
      test.done();
    },
    "sync test chain.hash.keccak(SHA-3-256)": function(test) {
      data.keccak.forEach(function(pair) {
        test.startTime();
        var result = chain.hash.keccak.mode("SHA-3-256").init().update(pair[0]).digest();
        test.endTime();
        test.assert.identical(result, pair[1]);
      });
      test.done();
    },
    "async test chain.hash.keccak(SHA-3-256)": function(test) {
      data.keccak.forEach(function(pair) {
        test.startTime();
        chain.hash.keccak.mode("SHA-3-256", function(instance) {
          instance.init(function(instance) {
            instance.update(pair[0], function(instance) {
              instance.digest(function(result) {
                test.endTime();
                test.assert.identical(result, pair[1]);
              });
            });
          });
        });
      });
      test.done();
    }
  };

tester.run(tests);
