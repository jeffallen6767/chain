// transaction.js
var
  utils = require("./utils"),
  transaction = {
    // sender & receiver are both identities
    "create": function(sender, receiver, amount) {
      var
        payload = {
          "sender": sender.publicKey,
          "receiver": receiver.publicKey,
          "amount": amount
        },
        signedMessage = utils.getSignedMessage(
          payload, 
          sender.bufferKeys.secretKey
        ),
        // create the transaction:
        transaction = {
          "payload": payload,
          "signedMessage": signedMessage
        };

      return transaction;
    }
  };

module.exports = transaction;

