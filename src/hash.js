var sha256 = require("sha256"),
  hash = {
    "sha256": function(text, next) {
      if (typeof next === "function") {
        var output = sha256(text);
        next(output);
      } else {
        return sha256(text);
      }
    }
  };
module.exports = hash;
