// wallet.js
function getModule(context, config) {
  var
    path = require("path"),
    fs = require("fs"),
    crypto = require('crypto'),
    ASCII_ONE_SPACE = ' ',
    ASCII_UNDERSCORE = '_',
    KEY_FILE_NAME = "keys",
    DATA_FILE_NAME = "data",
    algorithm = 'AES-256-CBC',
    //walletPath = path.resolve(__dirname, '../data/wallet'),
    loadFile = function(srcPath, fileName) {
      var
        filePath = path.resolve(srcPath, fileName),
        file = checkFile(filePath);
      if (file) {
        try {
          file = fs.readFileSync(filePath, 'utf8');
        } catch (e) {
          console.error("loadFile", srcPath, fileName, e);
        }
      }
      return file;
    },
    saveFile = function(srcPath, fileName, data) {
      if (!checkDir(srcPath)) {
        fs.mkdirSync(srcPath);
      }
      try {
        fs.writeFileSync(fileName, data);
      } catch (e) {
        console.error("saveFile", srcPath, fileName, e);
      }
    },
    checkDir = function(dirPath) {
      return (
        fs.existsSync(dirPath) &&
        fs.statSync(dirPath).isDirectory()
      );
    },
    checkFile = function(filePath) {
      return (
        fs.existsSync(filePath) &&
        fs.statSync(filePath).isFile()
      );
    },
    getPersonaDir = function(persona) {
      return path.resolve(
        walletPath, 
        persona.name.replace(/\s/g, '_')
      );
    },
    /* get */
    getKeyFilePath = function(personaDir) {
      return path.resolve(
        personaDir, 
        KEY_FILE_NAME
      );
    },
    getDataFilePath = function(personaDir) {
      return path.resolve(
        personaDir, 
        DATA_FILE_NAME
      );
    },
    /* load */
    loadKeyFile = function(persona) {
      var 
        personaDir = persona.meta.dir;
      persona.keys = checkDir(personaDir) && loadFile(personaDir, persona.meta.keyFilePath);
      persona.keys = persona.keys && JSON.parse(persona.keys);
      return persona.keys;
    },
    loadDataFile = function(persona) {
      var 
        personaDir = persona.meta.dir;
      persona.data = checkDir(personaDir) && loadFile(personaDir, persona.meta.dataFilePath);
      persona.data = persona.data && JSON.parse(persona.data);
      return persona.data;
    },
    /* create */
    createPersonaKeyFile = function(persona) {
      var
        utils = context.utils;
      persona.keys = persona.keys || {};
      persona.keys.mnemonic = persona.keys.mnemonic || context.words.hexToWords(
        utils.hexFromUInt8Array(
          utils.createRandomBytes(16)
        )
      );
      utils.setKeyPair(persona);
      return persona;
    },
    createPersonaDataFile = function(persona) {
      persona.data = {
        "index": existingAccounts.length
      };
      return persona;
    },
    /* save */
    savePersonaKeyFile = function(persona) {
      var
        meta = persona.meta,
        strData = lock(persona);
      saveFile(meta.dir, meta.keyFilePath, strData);
      return persona;
    },
    savePersonaDataFile = function(persona) {
      var
        meta = persona.meta,
        strData = context.utils.stringify(persona.data);
      saveFile(meta.dir, meta.dataFilePath, strData);
      return persona;
    },
    loadAccounts = function(callback) {
      var 
        accounts = [];
      //console.log("loadAccounts", walletPath);
      if (checkDir(walletPath)) {
        fs.readdir(walletPath, function(err, files) {
          console.log("loadAccounts", walletPath, [].slice.call(arguments));
          files.forEach(function(file) {
            var
              dPath = path.resolve(walletPath, file),
              name = file.replace(/\_/g, ASCII_ONE_SPACE),
              res = checkDir(dPath),
              persona = {
                "name": name
              };
            //console.log("loadAccounts", dPath, res, name);
            if (res) {
              accounts.push(
                load(persona)
              );
            }
          });
          // sort by data.index
          callback(accounts.sort(function(a,b) {
            return a.data.index - b.data.index;
          }));
        });
      } else {
        console.error("loadAccounts", walletPath, "is INVALID");
        callback(accounts);
      }
    },
    initPersona = function(persona) {
      var 
        dir = getPersonaDir(persona),
        dataFilePath = getDataFilePath(dir),
        keyFilePath = getKeyFilePath(dir);
      persona.meta = {
        "dir": dir,
        "dataFilePath": dataFilePath,
        "keyFilePath": keyFilePath
      };
    },
    /* api */
    create = function(persona) {
      initPersona(persona);
      createPersonaKeyFile(persona) && savePersonaKeyFile(persona);
      createPersonaDataFile(persona) && savePersonaDataFile(persona);
      allAccounts[persona.name] = persona;
      existingAccounts.push(persona);
      return persona;
    },
    load = function(persona) {
      initPersona(persona);
      loadKeyFile(persona);
      loadDataFile(persona);
      return persona;
    },
    save = function(persona) {
      console.log("wallet.save", persona);
      return savePersonaKeyFile(persona) && savePersonaDataFile(persona);
    },
    lock = function(persona) {
      if (persona.keys.locked) {
        return false;
      }
      var
        utils = context.utils,
        password_hash = utils.shake128(
          utils.sha256(persona.pass), 
          16
        ),
        shake = utils.shake256(password_hash, 16),
        iv = utils.uInt8ArrayFromString(shake),
        cipher = crypto.createCipheriv(algorithm, password_hash, iv),
        lockedKey = cipher.update(
          persona.keys.privateKey, 
          'utf8', 
          'hex'
        ) + cipher.final('hex'),
        mnemonic;
      
      cipher = crypto.createCipheriv(algorithm, password_hash, iv);
      mnemonic = cipher.update(
        persona.keys.mnemonic, 
        'utf8', 
        'hex'
      ) + cipher.final('hex');
      
      persona.keys = {
        "public": persona.keys.publicKey,
        "publicBuffer": persona.keys.publicBuffer,
        "locked": lockedKey,
        "mnemonic": mnemonic
      };
      return utils.stringify(persona.keys);
    },
    unlock = function(persona) {
      var 
        result = false;
      if (!persona.keys.privateKey && persona.pass && persona.pass.length) {
        try {
          result = _unlock(persona);
        } catch (err) {
          console.error("wallet.unlock", "user[" + persona.name + "] pass[" + persona.pass + "]", err.message);
        }
      }
      return result;
    },
    _unlock = function(persona) {
      var 
        utils = context.utils,
        password_hash = utils.shake128(
          utils.sha256(persona.pass), 
          16
        ),
        shake = utils.shake256(password_hash, 16),
        iv = utils.uInt8ArrayFromString(shake),
        decipher = crypto.createDecipheriv(algorithm, password_hash, iv),
        privateKey,
        mnemonic;
      
      privateKey = decipher.update(
        persona.keys.locked, 
        'hex', 
        'utf8'
      ) + decipher.final('utf8');
      
      decipher = crypto.createDecipheriv(algorithm, password_hash, iv);
      
      mnemonic = decipher.update(
        persona.keys.mnemonic, 
        'hex', 
        'utf8'
      ) + decipher.final('utf8');
        
      persona.keys = {
        "publicKey": persona.keys.public,
        "privateKey": privateKey,
        "mnemonic": mnemonic
      };
      
      utils.setKeyPair(persona);
      
      return utils.stringify(persona.keys);
    },
    dataPath = path.resolve(config.path, config.data.path),
    ensureDataPath = checkDir(dataPath) || fs.mkdirSync(dataPath),
    walletPath = path.resolve(dataPath, './wallet'),
    ensureWalletPath = checkDir(walletPath) || fs.mkdirSync(walletPath),
    allAccounts = {},
    existingAccounts = fs.readdirSync(walletPath).filter(function(file) {
      var
        dPath = path.resolve(walletPath, file),
        name = file.replace(/\_/g, ASCII_ONE_SPACE),
        res = checkDir(dPath),
        persona = {
          "name": name
        };
      //console.log("existingAccounts", dPath, res, name);
      if (res) {
        allAccounts[name] = persona;
        return true;
      } else {
        return false;
      }
    }),
    
    walletAPI = {
      "create": create,
      "load": load,
      "save": save,
      "lock": lock,
      "unlock": unlock,
      "loadAccounts": loadAccounts
    };
  return walletAPI;
}

module.exports = {
  "init": function(context, config) {
    return getModule(context, config);
  }
};
