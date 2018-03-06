// identity.js
var
  utils = require("./utils"),
  // create an identity
  create = function(idData) {
    var
      uInt8ToHex = utils.hexFromUInt8Array,
      randomBytes,
      hexBytes,
      words,
      testing,
      mnemonicSeed,
      bufferKeys;
    
    // initialize?
    if (!idData.words) {
      randomBytes = utils.createRandomBytes(16);
      console.log("randomBytes", randomBytes);
      hexBytes = uInt8ToHex(randomBytes);
      console.log("hexBytes", hexBytes);
      words = utils.hexToWords(hexBytes);
      console.log("words: ", words);
      idData.words = words;
      // test words back to hex matches:
      testing = utils.wordsToHex(words);
      console.log("back to hex: ", testing, testing === hexBytes);
    }
    
    // seed:
    mnemonicSeed = {
      "pass": idData.pass,
      "words": idData.words
    };
    console.log("mnemonicSeed", mnemonicSeed);
    
    // create keys:
    bufferKeys = utils.getKeyPair(mnemonicSeed);
    
    // so we don't have to calc this all the time...
    idData.bufferKeys = bufferKeys;
    
    // generate hex keys
    idData.privateKey = uInt8ToHex(bufferKeys.secretKey);
    idData.publicKey = uInt8ToHex(bufferKeys.publicKey);
    
    return idData;
  },
  // identity API
  identityAPI = {
    "create": create
  };

module.exports = identityAPI;
