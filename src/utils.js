// utils.js
function getModule(context, config) {
  var
    MAX_UINT = 0xffffffff,
    // file system
    fs = require("fs"),
    // path
    path = require('path'),
    // sodium cloride
    nacl = require("tweetnacl"),
    // stable json
    stringify = require('json-stable-stringify'),
    // from context:
    hash = context.hash(),
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
    readFile = function(filePath) {
      return fs.readFileSync(
        require.resolve(filePath), 
        'utf8'
      );
    },
    getTimeStamp = function() {
      return new Date().getTime();
    },
    getHash = function(str, mode, len) {
      return hash.keccak.mode(mode).init().update(str).digest(len);
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
    debugHash = function(obj) {
      return hash.keccak.mode("SHA-3-256").init().update(stringify(obj), null, true).digest(true);
    },
    getOptimalHasher = function(options) {
      options.partition = options.partition || function(str) {
        var result = options.parts = [str, ''];
        return result;
      };
      options.increment = options.increment || function() {
        return '';
      };
      var 
        fast_hasher = hash.keccak.mode("SHA-3-256", null, options || {}),
        hasher_api = {
          "inst": fast_hasher,
          "prepare": function(obj) {
            var
              input = typeof obj === 'object' ? stringify(obj) : obj;
            return fast_hasher.init().prepare_optimized(input);
          },
          "digest": fast_hasher.digest
        };
      return hasher_api;
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
    uInt32sFromUint8s = function(uInt8Array) {
      return Buffer.from(uInt8Array).toString('hex').match(/.{1,8}/g).map(function(val) {
        return parseInt(val, 16);
      });
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
    getMessageSignature = function(obj, keyBuffer) {
      return Buffer.from(nacl.sign.detached(
        objToUint8Array(obj), 
        keyBuffer
      )).toString('hex');
    },
    verifyMessageSignature = function(obj, signature, keyBuffer) {
      return nacl.sign.detached.verify(
        objToUint8Array(obj), 
        signature, 
        keyBuffer
      );
    },
    getRandomNonce = function() {
      return Math.floor(Math.random() * MAX_UINT);
    },
    getTemplatized = function(env, template) {
      return template.replace(/{{([a-z._]+)}}/ig, function() {
        var 
          args = [].slice.call(arguments),
          key = args[1].replace("env.", ''),
          value = env[key];
        return value;
      });
    },
    uInt32ToHex = function(val) {
      var 
        hex = val.toString(16),
        len = hex.length;
      return "00000000".slice(len) + hex;
    },
    utilsAPI = {
      /* pass-throughs */
      "stringify": stringify,
      /* internal */
      "log": log,
      "checkDir": checkDir,
      "checkFile": checkFile,
      "loadFile": loadFile,
      "saveFile": saveFile,
      "readFile": readFile,
      "getTimeStamp": getTimeStamp,
      /* hashing */
      "getHash": getHash,
      "sha256": sha256,
      "shake128": shake128,
      "shake256": shake256,
      "getObjectHash": getObjectHash,
      /* buffers and bytes */
      "charCodes": charCodes,
      "bytes": bytes,
      "intBytes": intBytes,
      "createRandomBytes": createRandomBytes,
      "objToUint8Array": objToUint8Array,
      "hexFromUInt8Array": hexFromUInt8Array,
      "uInt8ArrayFromString": uInt8ArrayFromString,
      "uInt32sFromUint8s": uInt32sFromUint8s,
      "uInt32ToHex": uInt32ToHex,
      /* nacl signatures */
      "getKeyPair": getKeyPair,
      "setKeyPair": setKeyPair,
      "getSignedMessage": getSignedMessage,
      "getMessageSignature": getMessageSignature,
      "verifyMessageSignature": verifyMessageSignature,
      /* mining */
      "getRandomNonce": getRandomNonce,
      "getTemplatized": getTemplatized,
      "debugHash": debugHash,
      "getOptimalHasher": getOptimalHasher
    };
  return utilsAPI;
}

module.exports = {
  "require": ["hash"],
  "init": function(context, config) {
    return getModule(context, config);
  }
};

