// INTEGRATION TESTS
var 
  miners = {
    "opencl": {
      "type": "opencl",
      "difficulty": 4,
      "cores": 1024,
      "extra": "Mined by: {{env.USERNAME}}@{{env.COMPUTERNAME}} on: {{env.VSCMD_ARG_HOST_ARCH}}"
    },
    "cpu": {
      "type": "miner",
      "difficulty": 2,
      "cores": 2,
      "extra": "Mined by: {{env.USERNAME}}@{{env.COMPUTERNAME}} on: {{env.VSCMD_ARG_HOST_ARCH}}"
    }
  },
  ids = [
    {
      "name": "Jeff Allen",
      "pass": "jeffpass"
    },
    {
      "name": "Joe Schmoe",
      "pass": "joepass"
    },
    {
      "name": "Julie Schmoolie",
      "pass": "juliepass"
    },
    {
      "name": "Fred Rocker",
      "pass": "fredpass"
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
  miningKeys = Object.keys(miners),
  tests = {
    "create identities": function(test, chain) {
      
      var 
        utils = chain.utils(),
        wallet = chain.wallet();

      // set-up ids
      ids.forEach(function(persona, idx) {
        test.startTime();
        
        wallet.load(persona);
        if (!persona.keys) {
          wallet.create(persona);
        }
        wallet.unlock(persona);
        
        test.endTime();
        
        utils.log("persona", persona);
        
        // test that privateKey contains publicKey
        test.assert.identical(
          persona.keys.publicKey,
          persona.keys.privateKey.slice(64),
          "test that privateKey contains publicKey"
        );
        
      });
      test.done();
    }
  };
  
// set-up additional tests for each type of miner
miningKeys.forEach(function(mKey) {
  var 
    setUp = miners[mKey],
    testKey = " - " + mKey + " miner ";
  
  // reset blockchain
  tests["reset blockchain" + testKey] = function(test, chain) {
    test.startTime();
    var 
      block = chain.block(),
      emptyBlockchain = block.resetBlockChain();
    
    test.endTime();
    
    // test resetBlockChain will empty the blockchain
    test.assert.identical(
      emptyBlockchain.length,
      [].length,
      "test resetBlockChain will empty the blockchain"
    );
    
    test.done();
  };
  
  tests["start miners" + testKey] = function(test, chain) {
    test.startTime();
    var
      miner = chain[setUp.type]();
    miner.start({
      "max": setUp.cores,
      "extra": setUp.extra,
      "testing": true,
      "ready": function(miners) {
        test.endTime();
        test.assert.identical(
          miners && miners.length || miners,
          setUp.cores,
          "correct number of miners started"
        );
        test.done();
      }
    });
  };
  
  tests["create genesis block" + testKey] = function(test, chain) {
    // create genesis block
    test.startTime();
    
    var 
      miner = chain[setUp.type](),
      transaction = chain.transaction(),
      utils = chain.utils(),
      user = ids[0],
      keys = user.keys;
    
    miner.mine({
      "data": data["genesis"], 
      "extra": setUp.extra,
      "difficulty": setUp.difficulty, 
      "nonce": 0,
      "keys": keys
    }, function(blockData) {
        var 
          msg = blockData.msg,
          newBlock = blockData.newBlock;
        test.endTime();
        
        console.log(msg);
        console.log(utils.stringify(newBlock));
        
        // test that previousHash is null
        test.assert.identical(
          newBlock.previousHash,
          '',
          "test that previousHash is empty string"
        );
          
        test.done();
    });
  };
  
  tests["create transactions" + testKey] = function(test, chain) {
    // create transactions on the blockchain
    test.startTime();
    
    var 
      block = chain.block(),
      miner = chain[setUp.type](),
      transaction = chain.transaction(),
      utils = chain.utils(),
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
      newTransaction = transaction.getNewTransaction(
        sender.keys,
        transactions
      ),
      added = transaction.addTransaction(newTransaction);
    
    //console.log("-----------> added", added);
    
    miner.mine({
      "data": {}, 
      "extra": setUp.extra,
      "difficulty": setUp.difficulty, 
      "nonce": 0,
      "keys": keys
    }, function(blockData) {
        var 
          msg = blockData.msg,
          newBlock = blockData.newBlock;
        test.endTime();
        
        console.log(msg);
        console.log(utils.stringify(newBlock));
        
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
        transactions.forEach(function(txn, idx) {
          //console.log("transaction", idx, txn);
          var 
            key = txn.receiver,
            expectedAmount = txMap[key];
          
          test.assert.identical(
            expectedAmount,
            txn.amount,
            "test that payee[" + idx + "] was paid correct amount"
          );
        });
        
        // 4 - test that block.hash starts with setUp.difficulty zeros
        test.assert.identical(
          parseInt(
            newBlock.hash.slice(0, setUp.difficulty) || "0",
            16
          ),
          0,
          "test that block.hash starts with " + setUp.difficulty + " zeros"
        );
        
        // test that previous block hash is correct
        test.assert.identical(
          newBlock.previousHash,
          block.getBlockByIndex(
            newBlock.index - 1
          ).hash,
          "test that previous block hash is correct"
        );
        
        test.done();
    });
  };
  
  tests["stop miners" + testKey] = function(test, chain) {
    var 
      miner = chain[setUp.type](),
      max = 2;
    
    test.startTime();
    
    miner.stop(function(txt) {
      console.log("-------------------------> miners stopped....", txt);
      test.endTime();
      test.assert.identical(
        0,
        0,
        "miners stopped"
      );
      test.done();
    });
  };
  
  tests["get balances" + testKey] = function(test, chain) {
    // get identity balance from the blockchain
    test.startTime();
    var 
      block = chain.block(),
      blockHashes = block.getBlockHashes(),
      users = ids.map(function(user) {
        user.balance = block.getUserBalance(user);
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
  };
});

module.exports = tests;
