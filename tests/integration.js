// INTEGRATION TESTS
var 
  MINING_DIFFICULTY = 1,
  
  ids = [
    {
      "name": "jeff allen",
      "data": {
        "pass": "My cat pukes all the time..."
      }
    },
    {
      "name": "joe schmoe",
      "data": {
        "pass": "Some other secret that only joe knows..."
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
    "reset blockchain": function(test, chain) {
      test.startTime();
      var 
        emptyBlockchain = chain.block.resetBlockChain();
      
      test.endTime();
      
      // test resetBlockChain will empty the blockchain
      test.assert.identical(
        emptyBlockchain.length,
        [].length,
        "test resetBlockChain will empty the blockchain"
      );
      
      test.done();
    },
    "create identities": function(test, chain) {
      // set-up ids
      ids.forEach(function(persona, idx) {
        test.startTime();
        var
          wallet = chain.wallet.load(persona);
        /*
        console.log("wallet", wallet);
        console.log("wallet.pass", wallet.pass);
        //var password_hash = chain.utils.getHash(wallet.pass, "SHA-3-256").slice(-32);
        var password_hash = chain.utils.getHash(
          chain.utils.getHash(
            wallet.pass, 
            "SHA-3-256"
          ), 
          "SHAKE-128",
          16
        );
        
        console.log("password_hash", password_hash);

        var shake = chain.utils.getHash(password_hash, "SHAKE-256", 16);
        console.log("shake", shake);
        
        var iv = chain.utils.uInt8ArrayFromString(shake);

        console.log("iv", iv);
        
        var crypto = require('crypto');
        var algorithm = 'AES-256-CBC';
        
        var cipher = crypto.createCipheriv(algorithm, password_hash, iv);
        
        var encryptedData = cipher.update(
          chain.utils.stringify(wallet), 
          'utf8', 
          'hex'
        ) + cipher.final('hex');
        console.log("encryptedData", encryptedData);
        
        process.exit(1);
        */
        
        if (!wallet) {
          persona.data = chain.identity.create(persona.data);
          console.log("BEFORE SAVE", persona);
          wallet = chain.wallet.save(persona);
        } else {
          
        }
        
        persona.data = wallet;
        
        //persona.data = chain.identity.create(persona.data);
        test.endTime();
        
        console.log("persona", persona);
        
        // test that privateKey contains publicKey
        test.assert.identical(
          persona.data.publicKey,
          persona.data.privateKey.slice(64),
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
        blockData = chain.block.create(
          data["genesis"], 1, random_nonce
        ),
        block = blockData.newBlock;
      
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
            ids[transaction[0]].data, 
            ids[transaction[1]].data,
            transaction[2]
          );
        }),
        blockData = chain.block.create(
          {"transactions": transactions}, MINING_DIFFICULTY, random_nonce
        ),
        newBlock = blockData.newBlock;

      test.endTime();
      //console.log(newBlock);
      
      // 1 - test that # of transactions is correct
      test.assert.identical(
        newBlock.data.transactions.length,
        transactions.length,
        "test that # of transactions is correct"
      );
      
      // 2 & 3 - test that each transaction made it onto the blockchain
      transactions.forEach(function(transaction, idx) {
        //console.log("transaction", idx, transaction);
        test.assert.identical(
          newBlock.data.transactions[idx],
          transaction,
          "test that transaction[" + idx + "] made it onto the blockchain"
        );
      });
      
      // 4 - test that block.hash starts with MINING_DIFFICULTY zeros
      test.assert.identical(
        parseInt(
          newBlock.hash.slice(0, MINING_DIFFICULTY),
          16
        ),
        0,
        "test that block.hash starts with " + MINING_DIFFICULTY + " zeros"
      );
      
      // test that previous block hash is correct
      test.assert.identical(
        newBlock.previousHash,
        chain.block.getBlockByIndex(
          newBlock.index - 1
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
          user.balance = chain.block.getUserBalance(user.data);
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
        "test that balance for " + users[0].name + " is correct"
      );
      
      // test that users[0] balance is correct
      test.assert.identical(
        users[1].balance,
        -2,
        "test that balance for " + users[1].name + " is correct"
      );
      
      test.done();
    }
  };

module.exports = tests;
