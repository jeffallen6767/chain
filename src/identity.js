// identity
var
  hasher = require("./hash").keccak.mode("SHA-3-256"),
  getIdentityHash = function(obj) {
    return hasher.init().update(
      JSON.stringify(obj)
    ).digest();
  },
  identity = {
    "create": function(idData) {
      var
        idHash = getIdentityHash(idData);
      
      return idHash;
    }
  };

module.exports = identity;
