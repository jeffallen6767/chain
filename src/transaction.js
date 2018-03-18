// transaction.js
// max safe int = 9,007,199,254,740,991
var
  utils = require("./utils"),
  coinbase = function() {
    
  },
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
          sender.privateBuffer
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

