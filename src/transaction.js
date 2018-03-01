// transactions
var
  nacl = require("tweetnacl"),
  hasher = require("./hash").keccak.mode("SHA-3-256"),
  getTransactionHash = function(obj) {
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
  charCodes = function(string) {
    return string.split('').map(function(character) {
      return character.charCodeAt(0);
    });
  },
  toUint8 = function(obj) {
    var
      strObj = JSON.stringify(obj),
      //lenStr = strObj.length,
      uint8 = Uint8Array.from(
        charCodes(
          strObj
        )
      ),
      //lenUint8 = uint8.length,
      x;
    /*
    console.log("toUint8", obj);
    console.log("strObj", strObj, lenStr);
    console.log("uint8", uint8, lenUint8);
    console.log("char", lenUint8 / lenStr);
    process.exit(1);
    */
    return uint8;
  },
  transaction = {
    // sender & receiver are both identities
    "create": function(sender, receiver, amount) {
      /*
      console.log("transaction.create");
      console.log("sender", sender);
      console.log("receiver", receiver);
      console.log("amount", amount);
      console.log("sender.bufferKeys.secretKey", sender.bufferKeys.secretKey);
      console.log("typeof sender.bufferKeys.secretKey", typeof sender.bufferKeys.secretKey);
      */
      var
        payload = {
          "sender": sender.publicKey,
          "receiver": receiver.publicKey,
          "amount": amount
        },
        payloadBuffer = toUint8(payload),
        // get signed-message, both params must be uint8buffers:
        signedMessageBuffer = nacl.sign(
          payloadBuffer, 
          sender.bufferKeys.secretKey
        ),
        signedMessage = Buffer.from(signedMessageBuffer).toString('hex'),
        
        // get signature, both params must be uint8buffers:
        signatureBuffer = nacl.sign.detached(
          payloadBuffer, 
          sender.bufferKeys.secretKey
        ),
        signature = Buffer.from(signatureBuffer).toString('hex'),
        
        // create the transaction:
        transaction = {
          "payload": payload,
          "signedMessage": signedMessage
        };
      
      console.log("--> signature.length", signature.length);
      
      //newTransaction.hash = getTransactionHash(newTransaction);
      //console.log("transaction", transaction);
      
      return transaction;
    }
  };

module.exports = transaction;

