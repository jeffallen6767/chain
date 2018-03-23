// INTEGRATION TESTS
var 
  utils = require('../src/utils'),
  log = utils.log,
  MINING_DIFFICULTY = 3,
  MINING_CORES = 2,
  MINING_EXTRA = 'Mined by: {{env.USER}}@{{env.NAME}} on: {{env.HOSTTYPE}}',
  ids = [
    {
      "name": "jeff allen",
      "pass": "This is my super secret passphrase...that only I know!"
    },
    {
      "name": "joe schmoe",
      "pass": "Some other secret that only joe knows..."
    },
    {
      "name": "Julie Schmoolie",
      "pass": "She has another secret..."
    },
    {
      "name": "Fred Rocker",
      "pass": "Rock n roll will never die..."
    }
  ],

  data = {
    "genesis": {
      "data": "The genesis block..."
    },
  },
  
  txns = [
    // user[0] sends 30 to multiple users
    [0, [[1, 5],[2, 10],[3, 15]]]
  ],
  
  balances = [
    70, 5, 10, 15
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
    
    "start miners": function(test, chain) {

      test.startTime();
      
      chain.miner.start({
        "max": MINING_CORES,
        "extra": MINING_EXTRA,
        "testing": true,
        "ready": function(miners) {
          test.endTime();
          test.assert.identical(
            miners && miners.length,
            MINING_CORES,
            "correct number of miners started"
          );
          test.done();
        }
      });
    },
    
    "create genesis block": function(test, chain) {
      // create genesis block
      test.startTime();
      
      var 
        user = ids[0],
        keys = user.keys;
      
      //console.log("user", user);
      //console.log("keys", keys);
      
      //process.exit(1);
      
      chain.miner.mine({
        "data": data["genesis"], 
        "difficulty": MINING_DIFFICULTY, 
        "nonce": utils.getRandomNonce(),
        "keys": keys
      }, function(blockData) {
          var 
            msg = blockData.msg,
            newBlock = blockData.newBlock;
          test.endTime();
          
          //console.log(msg);
          //console.log(utils.stringify(newBlock));
          
          // test that previousHash is null
          test.assert.identical(
            newBlock.previousHash,
            '',
            "test that previousHash is empty string"
          );
            
          test.done();
      });
    },
    
    "create transactions": function(test, chain) {
      // create transactions on the blockchain
      test.startTime();
      
      var 
        user = ids[0],
        keys = user.keys,
        // [0, [[1, 5],[2, 10],[3, 15]]]
        txn = txns[0],
        // from:
        senderIndex = txn[0],
        sender = ids[senderIndex],
        // to:
        recipients = txn[1],
        transactions = recipients.map(function(txnData) {
          var 
            receiverIndex = txnData[0],
            receiver = ids[receiverIndex],
            amount = txnData[1],
            result = {
              "receiver": receiver.keys.publicKey, 
              "amount": amount
            };
          // {"receiver": receiver.keys.publicKey, "amount": amount}
          return result;
        }),
        newTransaction = chain.transaction.getNewTransaction(
          sender.keys,
          transactions
        ),
        added = chain.transaction.addTransaction(newTransaction);
      
      //console.log("-----------> added", added);
      
      chain.miner.mine({
        "data": {}, 
        "difficulty": MINING_DIFFICULTY, 
        "nonce": utils.getRandomNonce(),
        "keys": keys
      }, function(blockData) {
          var 
            msg = blockData.msg,
            newBlock = blockData.newBlock;
          test.endTime();
          
          //console.log(msg);
          //console.log(utils.stringify(newBlock));
          
          // 1 - test that # of transactions is correct
          test.assert.identical(
            newBlock.data.transactions.length,
            txns.length + 1,
            "test that # of transactions is correct"
          );
          
          var 
            blockTransactions = newBlock.data.transactions,
            lastIdx = blockTransactions.length - 1,
            lastTransaction = blockTransactions[lastIdx],
            txMap = lastTransaction.txOuts.reduce(function(obj, txOut) {
              obj[txOut.address] = txOut.amount;
              return obj;
            }, {});
          
          //console.log("lastTransaction", lastTransaction);
          //console.log("txMap", txMap);
          
          // 2 & 3 - test that each payee made it into the transaction
          transactions.forEach(function(transaction, idx) {
            //console.log("transaction", idx, transaction);
            var 
              key = transaction.receiver,
              expectedAmount = txMap[key];
            
            test.assert.identical(
              expectedAmount,
              transaction.amount,
              "test that payee[" + idx + "] was paid correct amount"
            );
          });
          
          // 4 - test that block.hash starts with MINING_DIFFICULTY zeros
          test.assert.identical(
            parseInt(
              newBlock.hash.slice(0, MINING_DIFFICULTY) || "0",
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
      });
    },
  
    "get balances": function(test, chain) {
      // get identity balance from the blockchain
      test.startTime();
      //console.log(chain.block);
      var 
        blockHashes = chain.block.getBlockHashes(),
        users = ids.map(function(user) {
          user.balance = chain.block.getUserBalance(user);
          return user;
        });
      
      //users.forEach(function(user, idx) {
      //  console.log(idx, user.name, user.balance)
      //});
      
      test.endTime();
      
      users.forEach(function(user, idx) {
        // test that users[idx] balance is correct
        test.assert.identical(
          users[idx].balance,
          balances[idx],
          "test that balance for " + users[idx].name + " is correct"
        );
      });
      
      test.done();
    },

    "stop miners": function(test, chain) {
      var 
        max = 2;
      test.startTime();
      
      chain.miner.stop(function() {
        test.endTime();
        test.assert.identical(
          0,
          0,
          "miners stopped"
        );
        test.done();
      });
    },
    
  };

module.exports = tests;
