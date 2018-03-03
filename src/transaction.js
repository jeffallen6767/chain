// transaction.js
var
  utils = require("./utils"),
  transaction = {
    // sender & receiver are both identities
    "create": function(sender, receiver, amount) {
      var
        // create the transaction payload
        payload = {
          "sender": sender.publicKey,
          "receiver": receiver.publicKey,
          "amount": amount
        },
        // create a signed-message from the payload and secret key
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

