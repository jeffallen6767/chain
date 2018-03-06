// wallet.js
var
  path = require("path"),
  jfs = require('jsonfile'),
  utils = require("./utils"),
  cryp = require('crypto'),
  algorithm = 'AES-256-CBC',
  basePath = process.cwd(),
  walletPath = path.resolve(basePath, 'data/wallet'),
  KEYS_IGNORE_SAVE = ["bufferKeys"],
  prepareSaveData = function(data) {
    var
      obj = {},
      result;
    
    Object.keys(data).forEach(function(key) {
      if (KEYS_IGNORE_SAVE.indexOf(key) === -1) {
        obj[key] = data[key];
      }
    });

    var password_hash = utils.getHash(
      utils.getHash(
        obj.pass, 
        "SHA-3-256"
      ), 
      "SHAKE-128",
      16
    );
    console.log("password_hash", password_hash);

    var shake = utils.getHash(password_hash, "SHAKE-256", 16);
    console.log("shake", shake);
    
    var iv = utils.uInt8ArrayFromString(shake);

    console.log("iv", iv);
    
    var crypto = require('crypto');
    var algorithm = 'AES-256-CBC';
    
    var cipher = crypto.createCipheriv(algorithm, password_hash, iv);
    
    var encryptedData = cipher.update(
      utils.stringify(obj), 
      'utf8', 
      'hex'
    ) + cipher.final('hex');
    console.log("encryptedData", encryptedData);
    
    result = {
      "encryptedData": encryptedData
    };
    return result;
  },
  walletAPI = {
    "load": function(persona) {
      console.log("wallet.load", persona);
      var
        name = persona.name,
        obj = persona.data,
        fileName = name.replace(/\s/g, '_'),
        srcPath = path.resolve(walletPath, fileName),
        contents;
      try {
        contents = jfs.readFileSync(srcPath);
      } catch (e) {
        // smother error
      }
      console.log("contents", contents);
      
      if (contents) {
        var password_hash = utils.getHash(
          utils.getHash(
            obj.pass, 
            "SHA-3-256"
          ), 
          "SHAKE-128",
          16
        );
        console.log("password_hash", password_hash);

        var shake = utils.getHash(password_hash, "SHAKE-256", 16);
        console.log("shake", shake);
        
        var iv = utils.uInt8ArrayFromString(shake);

        console.log("iv", iv);
        
        var crypto = require('crypto');
        var algorithm = 'AES-256-CBC';
        
        var cipher = crypto.createCipheriv(algorithm, password_hash, iv);
        
        var decipher = crypto.createDecipheriv(algorithm, password_hash, iv);
        
        var decrypted = decipher.update(contents.encryptedData, 'hex', 'utf8') + decipher.final('utf8');
        console.log("decrypted", decrypted);
        
        var result = JSON.parse(decrypted);
        
        result.bufferKeys = {
          "publicKey": utils.uInt8ArrayFromString(result.publicKey), 
          "secretKey":utils.uInt8ArrayFromString(result.privateKey)
        };
        
        contents = result;
        
      }
      // just return persona.data
      return contents;
    },
    "save": function(persona) {
      console.log("wallet.save", persona);
      var
        name = persona.name,
        fileName = name.replace(/\s/g, '_'),
        destPath = path.resolve(walletPath, fileName),
        prepData = prepareSaveData(persona.data);
      console.log("prepData", prepData);
      jfs.writeFileSync(destPath, prepData, {spaces: 2, EOL: '\r\n'});
      return persona.data;
    }
  };

module.exports = walletAPI;
