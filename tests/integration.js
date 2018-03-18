// INTEGRATION TESTS
var 
  utils = require('../src/utils'),
  log = utils.log,
  MINING_DIFFICULTY = 1,
  
  ids = [
    {
      "name": "jeff allen",
      "pass": "This is my super secret passphrase...that only I know!"
    },
    {
      "name": "joe schmoe",
      "pass": "Some other secret that only joe knows..."
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
        
        chain.wallet.load(persona);
        
        chain.wallet.unlock(persona);
        
        test.endTime();
        
        //log("persona", persona);
        
        // test that privateKey contains publicKey
        test.assert.identical(
          persona.keys.publicKey,
          persona.keys.privateKey.slice(64),
          "test that privateKey contains publicKey"
        );
        
      });
      test.done();
    },
    "create genesis block": function(test, chain) {
      // create genesis block
      test.startTime();
      var 
        blockData = chain.block.create(
          data["genesis"], 1, utils.getRandomNonce()
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
        transactions = txns.map(function(transaction, idx) {
          return chain.transaction.create(
            ids[transaction[0]].keys, 
            ids[transaction[1]].keys,
            transaction[2]
          );
        }),
        blockData = chain.block.create(
          {"transactions": transactions}, MINING_DIFFICULTY, utils.getRandomNonce()
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
          utils.sha256(utils.stringify(newBlock.data.transactions[idx])),
          utils.sha256(utils.stringify(transaction)),
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
          user.balance = chain.block.getUserBalance(user.keys);
          return user;
        });
      
      //users.forEach(function(user, idx) {
      //  console.log(idx, user.name, user.balance)
      //});
      
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
