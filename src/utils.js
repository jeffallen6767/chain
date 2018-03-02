// utils.js
var
  nacl = require("tweetnacl"),
  hasher = require("./hash").keccak.mode("SHA-3-256"),
  getTimeStamp = function() {
    return new Date().getTime();
  },
  getObjectHash = function(obj) {
    return hasher.init().update(
      JSON.stringify(obj)
    ).digest();
  },
  bytes = function(byteString) {
    // return 2 char chunks
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
      messageBuffer = nacl.sign.open(signedMessage, publicKey),
      message = Buffer.from(messageBuffer).toString('hex'),
      result = message ? (JSON.stringify(payload) === objFromMessage(message).join('')) : false;

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
  getPrivateSeedBuffer = function(obj) {
    return Uint8Array.from(
      intBytes(
        getObjectHash(
          obj
        )
      )
    );
  },
  getKeyPair = function(data) {
    return nacl.sign.keyPair.fromSeed(
      getPrivateSeedBuffer(
        data
      )
    );
  },
  charCodes = function(string) {
    return string.split('').map(function(character) {
      return character.charCodeAt(0);
    });
  },
  objToUint8Array = function(obj) {
    return Uint8Array.from(
      charCodes(
        JSON.stringify(
          obj
        )
      )
    );
  },
  getSignedMessage = function(obj, keyBuffer) {
    return Buffer.from(nacl.sign(
      objToUint8Array(obj), 
      keyBuffer
    )).toString('hex');
  };
  

module.exports = {
  "getTimeStamp": getTimeStamp,
  "getObjectHash": getObjectHash,
  "bytes": bytes,
  "intBytes": intBytes,
  "objFromMessage": objFromMessage,
  "verifyTransaction": verifyTransaction,
  "getTransactionData": getTransactionData,
  "getKeyPair": getKeyPair,
  "objToUint8Array": objToUint8Array,
  "getSignedMessage": getSignedMessage
};
