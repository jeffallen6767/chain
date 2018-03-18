// utils.js
var
  nacl = require("tweetnacl"),
  stringify = require('json-stable-stringify'),
  hasher = require("./hash"),
  words = require("./words"),
  log = function() {
    console.log(
      [].slice.call(arguments).reduce(function(acc, item) {
        if (typeof item === 'object') {
          acc.push(stringify(item));
        } else {
          acc.push(item);
        }
        return acc;
      }, []).join(' ')
    );
  },
  getTimeStamp = function() {
    return new Date().getTime();
  },
  getHash = function(str, mode, len) {
    return hasher.keccak.mode(mode).init().update(str).digest(len);
  },
  shake128 = function(str, len) {
    return getHash(str, "SHAKE-128", len);
  },
  shake256 = function(str, len) {
    return getHash(str, "SHAKE-256", len);
  },
  sha256 = function(str) {
    return getHash(str, "SHA-3-256");
  },
  getObjectHash = function(obj) {
    return sha256(
      stringify(obj)
    );
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
  setKeyPair = function(persona) {
    var 
      keyPair = getKeyPair({
        "pass": persona.pass,
        "mnemonic": persona.keys.mnemonic
      });
    persona.keys.privateBuffer = persona.keys.privateBuffer || keyPair.secretKey;
    persona.keys.publicBuffer = persona.keys.publicBuffer || keyPair.publicKey;
    persona.keys.privateKey = persona.keys.privateKey || hexFromUInt8Array(persona.keys.privateBuffer);
    persona.keys.publicKey = persona.keys.publicKey || hexFromUInt8Array(persona.keys.publicBuffer);
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
  getRandomNonce = function() {
    var max_digits = 15,
      random_number = Math.floor(Math.random() * max_digits) - max_digits,
      random_nonce = parseInt(
        ((Math.random() + "").replace(".", "").slice(random_number))
      );
    return random_nonce;
  },
  utilsAPI = {
    /* pass-throughs */
    "stringify": stringify,
    "hexToWords": words.hexToWords,
    "wordsToHex": words.wordsToHex,
    /* internal */
    "log": log,
    "getTimeStamp": getTimeStamp,
    /* hashing */
    "getHash": getHash,
    "sha256": sha256,
    "shake128": shake128,
    "shake256": shake256,
    "getObjectHash": getObjectHash,
    /* buffers and bytes */
    "bytes": bytes,
    "intBytes": intBytes,
    "createRandomBytes": createRandomBytes,
    "objToUint8Array": objToUint8Array,
    "hexFromUInt8Array": hexFromUInt8Array,
    "uInt8ArrayFromString": uInt8ArrayFromString,
    /* transactions */
    "verifyTransaction": verifyTransaction,
    "getTransactionData": getTransactionData,
    /* nacl signatures */
    "getKeyPair": getKeyPair,
    "setKeyPair": setKeyPair,
    "getSignedMessage": getSignedMessage,
    /* mining */
    "getRandomNonce": getRandomNonce,
    
    
  };
  
module.exports = utilsAPI;
