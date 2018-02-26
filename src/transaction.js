// transactions
var
  hasher = require("./hash").keccak.mode("SHA-3-256"),
  getTransactionHash = function(obj) {
    return hasher.init().update(
      JSON.stringify(obj)
    ).digest();
  },
  transaction = {
    "create": function(sender, receiver, amount) {
      var
        newTransaction = {
          "sender": sender,
          "receiver": receiver,
          "amount": amount
        };
      
      newTransaction.hash = getTransactionHash(newTransaction);
      
      return newTransaction;
    }
  };

module.exports = transaction;
