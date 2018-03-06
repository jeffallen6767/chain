// utils.js
var
  nacl = require("tweetnacl"),
  stringify = require('json-stable-stringify'),
  hasher = require("./hash").keccak.mode("SHA-3-256"),
  words = require("./words"),
  getTimeStamp = function() {
    return new Date().getTime();
  },
  getObjectHash = function(obj) {
    return hasher.init().update(
      stringify(obj)
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
  uInt8ArrayFromString = function(string) {
    return Uint8Array.from(
      intBytes(
        string
      )
    );
  },
  hexFromUInt8Array = function(uInt8Array) {
    return Buffer.from(uInt8Array).toString('hex');
  },
  stringFromUint8Array = function(uInt8Array) {
    return Array.from(uInt8Array).map(function(num) {
      return String.fromCharCode(num);
    }).join('');
  },
  verifyTransaction = function(transaction) {
    //console.log("verifyTransaction", transaction);
    var
      // verifiy that the transaction came FROM the sender
      payload = transaction.payload,
      messageArray = nacl.sign.open(
        uInt8ArrayFromString(
          transaction.signedMessage
        ), 
        uInt8ArrayFromString(
          payload.sender
        )
      ),
      result = messageArray && (stringify(payload) === stringFromUint8Array(messageArray));
    
    return result;
  },
  validTransaction = function(transaction) {
    return transaction.payload.amount > 0;
  },
  getTransactionData = function(transactions) {
    var
      result = {
        "good": [],
        "bad": []
      };
    transactions.forEach(function(transaction, idx) {
      if (verifyTransaction(transaction) && validTransaction(transaction)) {
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
  createRandomBytes = function(num) {
    return nacl.randomBytes(num);
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
        stringify(
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
  },
  utilsAPI = {
    /* pass-throughs */
    "hexToWords": words.hexToWords,
    "wordsToHex": words.wordsToHex,
    /* internal */
    "getTimeStamp": getTimeStamp,
    "getObjectHash": getObjectHash,
    "bytes": bytes,
    "intBytes": intBytes,
    "verifyTransaction": verifyTransaction,
    "getTransactionData": getTransactionData,
    "getKeyPair": getKeyPair,
    "objToUint8Array": objToUint8Array,
    "getSignedMessage": getSignedMessage,
    "createRandomBytes": createRandomBytes,
    "hexFromUInt8Array": hexFromUInt8Array,
    
  };
  
module.exports = utilsAPI;
