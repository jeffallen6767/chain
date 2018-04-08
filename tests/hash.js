// TEST hash.js
var 
  data = {
    "keccak": [
      [
        "",
        "a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a"
      ],
      [
        "abc",
        "3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532"
      ],
      [
        "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq",
        "41c0dba2a9d6240849100376a8235e2c82e1b9998a999e21db32dd97496d3376"
      ]
    ]
  },
  tests = {
    "sync test chain.hash.sha256()": function(test, chain) {
      data.sha256.forEach(function(pair) {
        test.startTime();
        var result = chain.hash.sha256(pair[0]);
        test.endTime();
        test.assert.identical(result, pair[1]);
      });
      test.done();
    },
    "async test chain.hash.sha256()": function(test, chain) {
      data.sha256.forEach(function(pair) {
        test.startTime();
        chain.hash.sha256(pair[0], function(result) {
          test.endTime();
          test.assert.identical(result, pair[1]);
        });
      });
      test.done();
    },
    "sync test chain.hash.keccak(SHA-3-256)": function(test, chain) {
      data.keccak.forEach(function(pair) {
        test.startTime();
        var result = chain.hash.keccak.mode("SHA-3-256").init().update(pair[0]).digest();
        test.endTime();
        test.assert.identical(result, pair[1]);
      });
      test.done();
    },
    "async test chain.hash.keccak(SHA-3-256)": function(test, chain) {
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

module.exports = tests;