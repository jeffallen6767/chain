// INTEGRATION TESTS
var 
  MINING_DIFFICULTY = 1,
  
  ids = [
    {
      "data": {
        "name": "jeff allen",
        "secret": "The secret of my identity should be a bunch of words?"
      }
    },
    {
      "data": {
        "name": "joe schmoe",
        "data": "Some other secret that only joe knows..."
      }
    }
  ],

  data = {
    "genesis": {
      "data": "The genesis block..."
    },
  },
  
  txns = [
    // user[0] sends 2 to user[1]
    [0, 1, 2],
    // user[1] sends 4 to user[0]
    [1, 0, 4]
  ],
  
  tests = {
    "create identities": function(test, chain) {
      // set-up ids
      ids.forEach(function(persona, idx) {
        test.startTime();
        var 
          name = persona.data.name,
          identity = chain.identity.create(persona.data);

        test.endTime();
        
        persona.identity = identity;
        
        //console.log("persona", persona);
        
        // test that privateKey contains publicKey
        test.assert.identical(
          persona.identity.publicKey,
          persona.identity.privateKey.slice(64),
          "test that privateKey contains publicKey"
        );
        
      });
      test.done();
    },
    "create genesis block": function(test, chain) {
      // create genesis block
      test.startTime();
      var 
        max_digits = 15,
        random_number = Math.floor(Math.random() * max_digits) - max_digits,
        random_nonce = parseInt(
          ((Math.random() + "").replace(".", "").slice(random_number))
        ),
        block = chain.block.create(
          data["genesis"], 1, random_nonce
        );
      
      test.endTime();
      //console.log(block);
      
      // test that previousHash is null
      test.assert.identical(
        block.previousHash,
        null,
        "test that previousHash is null"
      );
        
      test.done();
    },
    "create transactions": function(test, chain) {
      // create transactions on the blockchain
      test.startTime();
      var 
        max_digits = 15,
        random_number = Math.floor(Math.random() * max_digits) - max_digits,
        random_nonce = parseInt(
          ((Math.random() + "").replace(".", "").slice(random_number))
        ),
        transactions = txns.map(function(transaction, idx) {
          return chain.transaction.create(
            ids[transaction[0]].identity, 
            ids[transaction[1]].identity,
            transaction[2]
          );
        }),
        transactionBlock = chain.block.create(
          {"transactions": transactions}, MINING_DIFFICULTY, random_nonce
        );

      test.endTime();
      //console.log(transactionBlock);
      
      // 1 - test that # of transactions is correct
      test.assert.identical(
        transactionBlock.data.transactions.length,
        transactions.length,
        "test that # of transactions is correct"
      );
      
      // 2 & 3 - test that each transaction made it onto the blockchain
      transactions.forEach(function(transaction, idx) {
        //console.log("transaction", idx, transaction);
        test.assert.identical(
          transactionBlock.data.transactions[idx],
          transaction,
          "test that transaction[" + idx + "] made it onto the blockchain"
        );
      });
      
      // 4 - test that block.hash starts with MINING_DIFFICULTY zeros
      test.assert.identical(
        parseInt(
          transactionBlock.hash.slice(0, MINING_DIFFICULTY),
          16
        ),
        0,
        "test that block.hash starts with " + MINING_DIFFICULTY + " zeros"
      );
      
      // test that previous block hash is correct
      test.assert.identical(
        transactionBlock.previousHash,
        chain.block.getBlockByIndex(
          transactionBlock.index - 1
        ).hash,
        "test that previous block hash is correct"
      );
      
      test.done();
    },
    "get balances": function(test, chain) {
      // get identity balance from the blockchain
      test.startTime();
      //console.log(chain.block);
      var 
        blockHashes = chain.block.getBlockHashes(),
        users = ids.map(function(user) {
          user.balance = chain.block.getUserBalance(user.identity);
          return user;
        });
      /*
      users.forEach(function(user, idx) {
        console.log(idx, user.name, user.balance)
      });
      */
      test.endTime();
      
      // test that users[0] balance is correct
      test.assert.identical(
        users[0].balance,
        2,
        "test that balance for " + users[0].identity.name + " is correct"
      );
      
      // test that users[0] balance is correct
      test.assert.identical(
        users[1].balance,
        -2,
        "test that balance for " + users[1].identity.name + " is correct"
      );
      
      test.done();
    }
  };

module.exports = tests;
