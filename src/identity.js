// identity
var
  hasher = require("./hash").keccak,
  nacl = require("tweetnacl"),
  getPrivateSeed = function(obj) {
    return hasher.mode("SHAKE-256").init().update(
      JSON.stringify(obj)
    ).digest(16);
  },
  identity = {
    "create": function(idData) {
      var
        privateSeed = getPrivateSeed(idData),
        //secretKeyBuf,
        //publicKeyBuf,
        bufferKeys;
      
      //console.log("privateSeed", privateSeed);
      
      //console.log("privateSeed.length", privateSeed.length);
      
      //bufferKeys = nacl.sign.keyPair.fromSecretKey(secretKeyBuf);
      //bufferKeys = nacl.sign.keyPair.fromSeed(privateSeed);
      bufferKeys = nacl.sign.keyPair();
      
      //console.log("bufferKeys.publicKey", bufferKeys.publicKey);
      //console.log("bufferKeys.secretKey", bufferKeys.secretKey);
      
      // so we don't have to calc this all the time...
      idData.bufferKeys = bufferKeys;
      idData.bufferPublicKey = bufferKeys.publicKey;
      //console.log("idData.bufferPublicKey", idData.bufferPublicKey);
      
      //  = Buffer.from(privateKey)
      idData.privateKey = Buffer.from(bufferKeys.secretKey).toString('hex');
      idData.publicKey = Buffer.from(bufferKeys.publicKey).toString('hex');
      
      return idData;
    }
  };

module.exports = identity;
