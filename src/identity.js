// identity.js
var
  utils = require("./utils"),
  // create an identity
  create = function(idData) {
    var
      bufferKeys = utils.getKeyPair(idData);
    
    // so we don't have to calc this all the time...
    idData.bufferKeys = bufferKeys;
    
    // generate hex keys
    idData.privateKey = Buffer.from(bufferKeys.secretKey).toString('hex');
    idData.publicKey = Buffer.from(bufferKeys.publicKey).toString('hex');
    
    return idData;
  },
  // identity API
  identityAPI = {
    "create": create
  };

module.exports = identityAPI;
