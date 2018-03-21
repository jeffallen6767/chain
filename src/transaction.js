// transaction.js
// max safe int = 9,007,199,254,740,991
var
  utils = require("./utils"),
  // TODO: dynamic coinbase amount
  COINBASE_AMOUNT = 50,
  unspentTxOutputs = [],
  updateUnspentTxOuts = function(newTxns) {
    var 
      unspentTxOuts = newTxns.map(function(txn) {
        return txn.txOuts.map(function(txOut, txOutIdx) {
          return unspentTxOut(
            txn.id,
            txOutIdx,
            txOut.address,
            txOut.amount
          );
        });
      }).reduce(function(acc, items) {
        return acc.concat(items);
      }, []),
      spentTxOuts = newTxns.map(function(txn) {
        return txn.txIns;
      }).reduce(function(acc, items) {
        return acc.concat(items);
      }).map(function(txIn) {
        return unspentTxOut(
          txIn.outId,
          txIn.outIdx,
          '',
          0
        );
      }),
      result = unspentTxOutputs.filter(function(unspentTxOut) {
        return !findUnspentTxOut(
          unspentTxOut.txOutId,
          unspentTxOut.txOutIdx,
          spentTxOuts
        );
      }).concat(unspentTxOuts);
    // update:
    unspentTxOutputs = result;
  },
  findUnspentTxOut = function(txOutId, txOutIdx, txOuts) {
    var 
      num = txOuts.length;
    for (x=0; x<num; x++) {
      txOut = txOuts[x];
      if (txOut.txOutId === txOutId && txOut.txOutIdx === txOutIdx) {
        return txOut;
      }
    }
    return false;
  },
  unspentTxOut = function(txOutId, txOutIdx, address, amount) {
    return {
      "txOutId": txOutId,
      "txOutIdx": txOutIdx,
      "address": address,
      "amount": amount
    };
  },
  txOut = function(address, amount) {
    return {
      "address": address,
      "amount": amount
    };
  },
  txIn = function(outId, outIdx, signature) {
    return {
      "outId": outId,
      "outIdx": outIdx,
      "signature": signature
    };
  },
  txn = function(id, txIns, txOuts) {
    return {
      "id": id,
      "txIns": txIns,
      "txOuts": txOuts
    };
  },
  getTxnId = function(txn) {
    return getTxnIdHash(txn.txIns, txn.txOuts);
  },
  getTxnIdHash = function(tIns, tOuts) {
    var 
      strTxIn = tIns.reduce(function(acc, input) {
        acc.push(input.outId, input.outIdx);
        return acc;
      }, []).join(''),
      strTxOut = tOuts.reduce(function(acc, output) {
        acc.push(output.address, output.amount);
        return acc;
      }, []).join(''),
      txId = utils.sha256(strTxIn + strTxOut);
    return txId;
  },
  validTransaction = function(txn, txOuts) {
    if (typeof txn.id !== 'string') {
      console.error("validTransaction:error typeof txn.id !== 'string' [" + typeof txn.id + "]");
      return false;
    }
    if (typeof txn.txIns !== 'object' || !Array.isArray(txn.txIns)) {
      console.error("validTransaction:error typeof txn.txIns !== 'object' || !Array.isArray(txn.txIns) [" + typeof txn.txIns + "," + !Array.isArray(txn.txIns) + "]");
      return false;
    }
    if (typeof txn.txOuts !== 'object' || !Array.isArray(txn.txOuts)) {
      console.error("validTransaction:error typeof txn.txOuts !== 'object' || !Array.isArray(txn.txOuts) [" + typeof txn.txOuts + "," + !Array.isArray(txn.txIns) + "]");
      return false;
    }
    if (getTxnId(txn) !== txn.id) {
      console.error("validTransaction:error getTxnId(txn) !== txn.id [" + getTxnId(txn) + " !== " + txn.id + "]");
      return false;
    }
    return validTxnValues(txn);
  },
  validCoinbaseTxn = function(txn, blockIndex) {
    if (txn.txIns.length !== 1) {
      console.error("validCoinbaseTxn:error the coinbase transaction requires one txIn [" + txn.txIns.length + "]");
      return false;
    }
    if (txn.txIns[0].txOutIdx !== blockIndex) {
      console.error("validCoinbaseTxn:error the coinbase transaction requires txIn.txOutIdx === blockindex [" + txIn.txOutIdx + " === " + blockindex + "]");
      return false;
    }
    if (txn.txOuts.length !== 1) {
      console.error("validCoinbaseTxn:error the coinbase transaction requires one txOut [" + txn.txOuts.length + "]");
      return false;
    }
    if (txn.txOuts[0].amount !== COINBASE_AMOUNT) {
      console.error("validCoinbaseTxn:error the coinbase transaction requires txOut.amount === COINBASE_AMOUNT [" + txn.txOuts[0].amount + " === " + COINBASE_AMOUNT + "]");
      return false;
    }
    return true;
  },
  validTxnValues = function(txn) {
    var 
      txInsOk = txn.txIns.map(function(txIn) {
        return validTxIn(txIn, txn);
      }).reduce(function(acc, val) {
        return acc && val;
      }, true);
    if (!txInsOk) {
      console.error("validTxnValues:error some of the txIns are invalid in txn [" + txn.id + "] " + utils.stringify(txn.txIns));
      return false;
    }
    return validTxOuts(txn);
  },
  validTxIn = function(txIn, txn) {
    var 
      txOut = findUnspentTxOut(
        txIn.outId,
        txIn.outIdx,
        unspentTxOutputs
      ),
      result;
    if (!txOut) {
      console.error("validTxIn:error referenced txOut not found [" + txIn.outId + ", " + txIn.outIdx + "] " + utils.stringify(unspentTxOutputs));
      return false;
    }
    result = utils.verifyMessageSignature(
      txn.id,
      txIn.signature,
      txOut.address
    );
    if (!result) {
      console.error("validTxIn:error invalid signature [" + txn.id + ", " + txIn.signature + ", " + txOut.address + "]");
      return false;
    }
    return result;
  },
  validTxOuts = function(txn) {
    var 
      totalIn = txn.txIns.map(function(txIn) {
        return getTxInAmount(txIn);
      }).reduce(function(total, amount) {
        return total + amount;
      }, 0),
      totalOut = txn.txOuts.map(function(txOut) {
        return txOut.amount;
      }).reduce(function(total, amount) {
        return total + amount;
      }, 0);
    if (totalIn !== totalOut) {
      console.error("validTxOuts:error totalIn !== totalOut [" + totalIn + " !== " + totalOut + "]");
      return false;
    }
    return totalOut;
  },
  getTxInAmount = function(txIn) {
    var 
      txOut = findUnspentTxOut(
        txIn.outId,
        txIn.outIdx,
        unspentTxOutputs
      );
    if (!txOut) {
      console.error("getTxInAmount:error referenced txOut not found [" + txIn.outId + ", " + txIn.outIdx + "] " + utils.stringify(unspentTxOutputs));
      return false;
    }
    return txOut.amount;
  },
  validateBlockTxns = function(txns, blockindex) {
    var 
      coinbaseTxn = txns[0],
      allTxnIns,
      noDuplicateTxnIns,
      normalTxns;
    if (!validCoinbaseTxn(coinbaseTxn, blockIndex)) {
      console.error("validateBlockTxns:error invalid coinbase txn for blockindex [" + blockIndex + "] " + utils.stringify(coinbaseTxn));
      return false;
    }
    // check for duplicate txIns
    allTxnIns = txns.map(function(txn) {
      return txn.txIns.map(function(txIn) {
        return [txIn.outId, txIn.outIdx].join("_");
      });
    }).flatten();
    noDuplicateTxnIns = allTxnIns.sort().reduce(function(acc, val, idx, values) {
      return acc && val !== values[idx-1];
    });
    if (!noDuplicateTxnIns) {
      console.error("validateBlockTxns:error txns contain duplicate txIns " + utils.stringify(allTxnIns));
      return false;
    }
    normalTxns = txns.slice(1);
    return normalTxns.map(function(txn) {
      return validTransaction(txn);
    }).reduce(function(acc, val) {
      return acc && val;
    }, true);
  },
  signTxn = function(txn, txInIdx, privateBuffer, unspentTxOuts) {
    var 
      txIn = txn.txIns[txInIdx],
      data = txn.id,
      // todo: unspent txouts
      signature = utils.getMessageSignature(
        data, 
        privateBuffer
      );
    return signature;
  },
  getCoinbaseTransaction = function(address, blockindex) {
    var 
      coinIns = [txIn('', blockindex, '')],
      coinOuts = [txOut(address, COINBASE_AMOUNT)],
      coinId = getTxnIdHash(coinIns, coinOuts),
      coinbaseTxn = txn(coinId, coinIns, coinOuts);
    return coinbaseTxn;
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

