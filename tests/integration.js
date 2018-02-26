// integration tests
var 
  ids = [
    {
      "name": "jeff allen",
      "data": "The secret of my identity should be a bunch of words?"
    },
    {
      "name": "joe schmoe",
      "data": "Some other secret that only joe knows..."
    }
  ],

  data = {
    "genesis": {
      "data": "The genesis block..."
    },
  },
  
  tests = {
    "create identities": function(test, chain) {
      // set-up ids
      ids.forEach(function(persona, idx) {
        test.startTime();
        var 
          name = persona.name,
          identity = chain.identity.create(
            persona
          );
        console.log(idx, name, identity);
        test.endTime();
        persona.hash = identity;
        persona.balance = 10.0;
      });
      console.log(ids);
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
      console.log(block);
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
        transactions = [
          {
            "sender": ids[1].hash,
            "receiver": ids[0].hash,
            "amount": 3.33
          },
          {
            "sender": ids[0].hash,
            "receiver": ids[1].hash,
            "amount": 1.33
          }
        ],
        transactionBlock = chain.block.create(
          {"transactions": transactions}, 4, random_nonce
        );
      
      test.endTime();
      console.log(transactionBlock);
      test.done();
    },
    "get balances": function(test, chain) {
      // get identity balance from the blockchain
      test.startTime();
      console.log(chain.block);
      var 
        blockHashes = chain.block.getBlockHashes(),
        users = ids.map(function(user) {
          user.balance = chain.block.getUserBalance(user.hash);
          return user;
        });
      
      console.log("blockHashes", blockHashes);
      
      users.forEach(function(user, idx) {
        console.log(idx, user.name, user.balance)
      });
      
      test.endTime();
      
      test.assert.identical(
        users[0].balance,
        2
      );
      
      test.assert.identical(
        users[1].balance,
        -2
      );
      
      test.done();
    }
  };

module.exports = tests;




        /*
        test.startTime();
        var 
          identity = chain.identity.create(
            data[key]
          );
        console.log(idx, key, identity);
        test.endTime();
        
        test.assert.identical(
          JSON.stringify(data[key]), 
          JSON.stringify(block.data)
        );
        test.assert.identical(
          idx, 
          block.index
        );
        */