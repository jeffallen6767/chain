// wallet.js
var
  path = require("path"),
  fs = require("fs"),
  utils = require("./utils"),
  crypto = require('crypto'),
  KEY_FILE_NAME = "keys",
  DATA_FILE_NAME = "data",
  algorithm = 'AES-256-CBC',
  basePath = process.cwd(),
  walletPath = path.resolve(basePath, 'data/wallet'),
  KEYS_IGNORE_SAVE = ["bufferKeys"],
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
    persona.keys = checkDir(persona.dir) && loadFile(persona.dir, persona.keyFilePath);
    persona.keys = persona.keys && JSON.parse(persona.keys);
    return persona.keys;
  },
  loadDataFile = function(persona) {
    persona.data = checkDir(persona.dir) && loadFile(persona.dir, persona.dataFilePath);
    persona.data = persona.data && JSON.parse(persona.data);
    return persona.data;
  },
  loadPersonaKeyFile = function(persona) {
    persona.keyFilePath = getKeyFilePath(persona.dir);
    return loadKeyFile(persona);
  },
  loadPersonaDataFile = function(persona) {
    persona.dataFilePath = getDataFilePath(persona.dir);
    return loadDataFile(persona);
  },
  /* create */
  createPersonaKeyFile = function(persona) {
    persona.keys = persona.keys || {};
    persona.keys.mnemonic = persona.keys.mnemonic || utils.hexToWords(
      utils.hexFromUInt8Array(
        utils.createRandomBytes(16)
      )
    );
    utils.setKeyPair(persona);
    return persona;
  },
  createPersonaDataFile = function(persona) {
    persona.data = {};
    return persona;
  },
  /* save */
  savePersonaKeyFile = function(persona) {
    var
      strData = lock(persona);
    saveFile(persona.dir, persona.keyFilePath, strData);
    return persona;
  },
  savePersonaDataFile = function(persona) {
    var
      strData = utils.stringify(persona.data);
    saveFile(persona.dir, persona.dataFilePath, strData);
    return persona;
  },
  /* api */
  load = function(persona) {
    persona.dir = getPersonaDir(persona);
    loadPersonaKeyFile(persona) || (createPersonaKeyFile(persona) && savePersonaKeyFile(persona));
    loadPersonaDataFile(persona) || (createPersonaDataFile(persona) && savePersonaDataFile(persona));
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
    if (persona.keys.privateKey || !persona.pass || !persona.pass.length) {
      return false;
    }
    var 
      password_hash = utils.shake128(
        utils.sha256(persona.pass), 
        16
      ),
      shake = utils.shake256(password_hash, 16),
      iv = utils.uInt8ArrayFromString(shake),
      decipher = crypto.createDecipheriv(algorithm, password_hash, iv),
      privateKey = decipher.update(
        persona.keys.locked, 
        'hex', 
        'utf8'
      ) + decipher.final('utf8'),
      mnemonic;
    decipher = crypto.createDecipheriv(algorithm, password_hash, iv),
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
  walletAPI = {
    "load": load,
    "save": save,
    "lock": lock,
    "unlock": unlock
  };

module.exports = walletAPI;
