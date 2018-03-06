// wallet.js
var
  utils = require("./utils"),
  words = require("./words"),
  walletAPI = {
    "test": function() {
      words.print();
    }
  };

module.exports = walletAPI;
