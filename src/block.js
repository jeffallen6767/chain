var
  nacl = require("tweetnacl"),
  hasher = require("./hash").keccak.mode("SHA-3-256"),
  blockChain = [],
  getNextIndex = function() {
    return blockChain.length;
  },
  getPreviousHash = function(idx) {
    return idx ? blockChain[idx-1].hash : null;
  },
  getTimeStamp = function() {
    return new Date().getTime();
  },
  getBlockHash = function(obj) {
    return hasher.init().update(
      JSON.stringify(obj)
    ).digest();
  },
  bytes = function(byteString) {
    // join all args into one string then split into 2 char chunks
    return byteString.match(/.{1,2}/g);
  },
  intBytes = function(byteString) {
    return bytes(byteString).map(function(strByte) {
      return parseInt(strByte, 16);
    });
  },
  objFromMessage = function(message) {
    return intBytes(message).map(function(num) {
      return String.fromCharCode(num);
    });
  },
  verifyTransaction = function(transaction) {
    console.log("verifyTransaction", transaction);
    var
      result = true,
      payload = transaction.payload,
      publicKey = Uint8Array.from(
        intBytes(
          payload.sender
        )
      ),
      signedMessage = Uint8Array.from(
        intBytes(
          transaction.signedMessage
        )
      ),
      //signature = transaction.signature,
      messageBuffer,
      message;
    
    //console.log("->payload.sender", payload.sender);
    //console.log("->publicKey", publicKey);
    
    messageBuffer = nacl.sign.open(signedMessage, publicKey);
    message = Buffer.from(messageBuffer).toString('hex');
    //console.log("message", message);
    
    result = message ? (JSON.stringify(payload) === objFromMessage(message).join('')) : false;
    
    //console.log("result", result);
    
    //process.exit(1);
    
    return result;
  },
  getTransactionData = function(transactions) {
    var
      result = {
        "good": [],
        "bad": []
      };
    transactions.forEach(function(transaction, idx) {
      if (verifyTransaction(transaction)) {
        result.good.push(
          transaction
        );
      } else {
        result.bad.push(
          transaction
        );
      }
    });
    return result;
  },
  block = {
    "create": function(data, difficulty, nonce) {
      //console.log("--------> data", data);
      var
        difficulty = difficulty || 0,
        nonce = nonce || 0,
        mining = difficulty ? true : false,
        index = getNextIndex(),
        previousHash = getPreviousHash(index),
        timestamp = getTimeStamp(),
        transactionData = index ? getTransactionData(data.transactions) : data,
        goodTransactionData = index ? transactionData.good : data,
        badTransactionData = index ? transactionData.bad : data,
        newBlock = {
          "data": data,
          "index": index,
          "previousHash": previousHash,
          "timestamp": timestamp,
          "difficulty": difficulty,
          "nonce": nonce
        },
        // force at least one mining message
        lastMsg = timestamp,
        lastVal = 0,
        maxInt = Number.MAX_SAFE_INTEGER;
      
      if (index > 0) {
        data.transactions = goodTransactionData;
      }
      
      newBlock.data = data;
      
      // set hash
      newBlock.hash = getBlockHash(newBlock);
      
      while (mining) {
        var
          test = newBlock.hash.slice(0, difficulty),
          value = parseInt(test, 16),
          done = value === 0,
          next,
          time, elapsed, perSecond;
        lastVal++;
        if (done) break;
        if (newBlock.nonce === maxInt) {
          newBlock.nonce = 0;
        } else {
          newBlock.nonce++;
        }
        newBlock.hash = getBlockHash(newBlock);
        time = getTimeStamp();
        if (time - lastMsg > 1000) {
          lastMsg = time;
          elapsed = (time - timestamp) / 1000;
          perSecond = Math.round(lastVal / elapsed);
          console.log("mining difficulty", difficulty, "@", perSecond, "/per second", newBlock.hash, newBlock.nonce);
        }
      }
      
      if (mining) {
        console.log(
          "BLOCKHASH FOUND!!! mining difficulty", 
          difficulty, 
          "in", 
          elapsed, 
          "seconds @", 
          perSecond, 
          "/per second", 
          newBlock.hash, 
          newBlock.nonce, 
          lastVal, 
          elapsed
        );
      }
      
      blockChain.push(newBlock);
      
      return newBlock;
    },
    "getBlockHashes": function() {
      return blockChain.reduce(function(acc, block) {
        acc.push(
          block.hash
        );
        return acc;
      }, []);
    },
    "getUserBalance": function(userIdentity) {
      return blockChain.reduce(function(total, block) {
        var
          userPublicKey = userIdentity.publicKey,
          transactions = (block.data && Array.isArray(block.data.transactions) && block.data.transactions) || [];
        transactions.forEach(function(transaction) {
          if (transaction.payload.sender === userPublicKey) {
            total -= transaction.payload.amount;
          }
          if (transaction.payload.receiver === userPublicKey) {
            total += transaction.payload.amount;
          }
        });
        return total;
      }, 0);
    }
  };

module.exports = block;
