var chain = require("./index"),
  tester = require("testing"),
  data = {
    "sha256": [
      [
        "",
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      ],
      [
        "abc",
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
      ],
      [
        "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq",
        "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1"
      ]
    ],
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
