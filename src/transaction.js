// transaction.js
function getModule(context, config) {
  // max safe int = 9,007,199,254,740,991
  var
    // TODO: dynamic coinbase amount
    COINBASE_AMOUNT = 50,
    todoTransactions = [],
    unspentTxOutputs = [],
    updateUnspentTxOuts = function(newTxns, blockIdx) {
      //console.log("updateUnspentTxOuts", blockIdx, newTxns);
      var 
        unspentTxOuts = newTxns.map(function(txn) {
          return txn.txOuts.map(function(aTxOut, txOutIdx) {
            return unspentTxOut(
              blockIdx,
              txn.txId,
              txOutIdx,
              aTxOut.address,
              aTxOut.amount
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
            txIn.blkIdx,
            txIn.txOutId,
            txIn.txOutIdx,
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
      //console.log("updateUnspentTxOuts", newTxns, result);
      unspentTxOutputs = result;
    },
    findUnspentTxOut = function(txOutId, txOutIdx, txOuts) {
      //console.log("findUnspentTxOut", txOutId, txOutIdx, txOuts);
      var 
        num = txOuts.length,
        aTxOut, x;
      
      for (x=0; x<num; x++) {
        aTxOut = txOuts[x];
        if (aTxOut.txOutId === txOutId && aTxOut.txOutIdx === txOutIdx) {
          return aTxOut;
        }
      }
      
      return false;
    },
    unspentTxOut = function(blockIdx, txOutId, txOutIdx, address, amount) {
      return {
        "blockIdx": blockIdx,
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
    txIn = function(blkIdx, txOutId, txOutIdx, signature) {
      return {
        "blkIdx": blkIdx,
        "txOutId": txOutId,
        "txOutIdx": txOutIdx,
        "signature": signature
      };
    },
    txn = function(txId, txIns, txOuts) {
      return {
        "txId": txId,
        "txIns": txIns,
        "txOuts": txOuts
      };
    },
    getTxnId = function(txn) {
      return getTxnIdHash(txn.txIns, txn.txOuts);
    },
    getTxnIdHash = function(txIns, txOuts) {
      var 
        strTxIn = txIns.reduce(function(acc, input) {
          acc.push(input.txOutId, input.txOutIdx);
          return acc;
        }, []).join(''),
        strTxOut = txOuts.reduce(function(acc, output) {
          acc.push(output.address, output.amount);
          return acc;
        }, []).join(''),
        txId = context.utils.sha256(strTxIn + strTxOut);
      return txId;
    },
    validTransaction = function(txn) {//, txOuts
      if (typeof txn.txId !== 'string') {
        throw new Error(
          "validTransaction:error typeof txn.txId !== 'string' ["
            + typeof txn.txId
            + "]"
        );
        return false;
      }
      if (typeof txn.txIns !== 'object' || !Array.isArray(txn.txIns)) {
        throw new Error(
          "validTransaction:error typeof txn.txIns !== 'object' || !Array.isArray(txn.txIns) ["
            + typeof txn.txIns
            + ","
            + !Array.isArray(txn.txIns)
            + "]"
        );
        return false;
      }
      if (typeof txn.txOuts !== 'object' || !Array.isArray(txn.txOuts)) {
        throw new Error(
          "validTransaction:error typeof txn.txOuts !== 'object' || !Array.isArray(txn.txOuts) ["
            + typeof txn.txOuts
            + ","
            + !Array.isArray(txn.txIns)
            + "]"
        );
        return false;
      }
      if (getTxnId(txn) !== txn.txId) {
        throw new Error(
          "validTransaction:error getTxnId(txn) !== txn.txId ["
            + getTxnId(txn)
            + " !== "
            + txn.txId
            + "]"
        );
        return false;
      }
      return validTxnValues(txn);
    },
    validCoinbaseTxn = function(txn, blockIndex) {
      //console.log("validCoinbaseTxn", txn, blockIndex);
      if (txn.txIns.length !== 1) {
        throw new Error(
          "validCoinbaseTxn:error the coinbase transaction requires one txIn ["
            + txn.txIns.length
            + "]"
        );
        return false;
      }
      if (txn.txIns[0].txOutIdx !== blockIndex) {
        throw new Error(
          "validCoinbaseTxn:error the coinbase transaction requires txIn.txOutIdx === blockIndex ["
            + txIn.txOutIdx
            + " === "
            + blockIndex
            + "]"
        );
        return false;
      }
      if (txn.txOuts.length !== 1) {
        throw new Error(
          "validCoinbaseTxn:error the coinbase transaction requires one txOut ["
            + txn.txOuts.length
            + "]"
        );
        return false;
      }
      if (txn.txOuts[0].amount !== COINBASE_AMOUNT) {
        throw new Error(
          "validCoinbaseTxn:error the coinbase transaction requires"
            + " txOut.amount === COINBASE_AMOUNT ["
            + txn.txOuts[0].amount
            + " === "
            + COINBASE_AMOUNT
            + "]"
        );
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
        throw new Error(
          "validTxnValues:error some of the txIns are invalid in txn ["
            + txn.txId 
            + "] "
            + context.utils.stringify(txn.txIns)
        );
        return false;
      }
      return validTxOuts(txn);
    },
    validTxIn = function(txIn, txn) {
      //console.log("validTxIn", txIn, txn);
      var 
        utils = context.utils,
        txOut = findUnspentTxOut(
          txIn.txOutId,
          txIn.txOutIdx,
          unspentTxOutputs
        ),
        result;
      if (!txOut) {
        throw new Error(
          "validTxIn:error referenced txOut not found ["
            + txIn.txOutId
            + ", "
            + txIn.txOutIdx
            + "] "
            + utils.stringify(unspentTxOutputs)
        );
        return false;
      }
      //console.log("--utils.verify", txn.txId, txIn.signature, txOut.address, txn);
      result = utils.verifyMessageSignature(
        txn.txId,
        utils.uInt8ArrayFromString(txIn.signature),
        utils.uInt8ArrayFromString(txOut.address)
      );
      if (!result) {
        throw new Error(
          "validTxIn:error invalid signature ["
            + txn.txId
            + ", "
            + txIn.signature
            + ", "
            + txOut.address
            + "]"
        );
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
        throw new Error(
          "validTxOuts:error totalIn !== totalOut ["
            + totalIn
            + " !== "
            + totalOut
            + "]"
        );
        return false;
      }
      return totalOut;
    },
    getTxInAmount = function(txIn) {
      var 
        txOut = findUnspentTxOut(
          txIn.txOutId,
          txIn.txOutIdx,
          unspentTxOutputs
        );
      if (!txOut) {
        throw new Error(
          "getTxInAmount:error referenced txOut not found ["
            + txIn.txOutId
            + ", "
            + txIn.txOutIdx
            + "] "
            + context.utils.stringify(unspentTxOutputs)
        );
        return false;
      }
      return txOut.amount;
    },
    validateBlockTxns = function(txns, blockIndex) {
      var 
        coinbaseTxn = txns[0],
        allTxnIns,
        noDuplicateTxnIns,
        normalTxns;
      if (!validCoinbaseTxn(coinbaseTxn, blockIndex)) {
        throw new Error(
          "validateBlockTxns:error invalid coinbase txn for blockIndex ["
            + blockIndex
            + "] "
            + context.utils.stringify(coinbaseTxn)
        );
        return false;
      }
      // check for duplicate txIns
      allTxnIns = txns.map(function(txn) {
        return txn.txIns.map(function(txIn) {
          return [txIn.txOutId, txIn.txOutIdx].join("_");
        });
      }).flatten();
      noDuplicateTxnIns = allTxnIns.sort().reduce(function(acc, val, idx, values) {
        return acc && val !== values[idx-1];
      });
      if (!noDuplicateTxnIns) {
        throw new Error(
          "validateBlockTxns:error txns contain duplicate txIns "
            + context.utils.stringify(allTxnIns)
        );
        return false;
      }
      normalTxns = txns.slice(1);
      return normalTxns.map(function(txn) {
        return validTransaction(txn);
      }).reduce(function(acc, val) {
        return acc && val;
      }, true);
    },
    signTxn = function(txId, sender) {
      var 
        signature = context.utils.getMessageSignature(
          txId, 
          sender.privateBuffer
        );
        
      return signature;
    },
    getCoinbaseTransaction = function(address, blockIndex) {
      var 
        coinIns = [txIn(blockIndex, '', blockIndex, '')],
        coinOuts = [txOut(address, COINBASE_AMOUNT)],
        coinId = getTxnIdHash(coinIns, coinOuts),
        coinbaseTxn = txn(coinId, coinIns, coinOuts);
      return coinbaseTxn;
    },
    getNewTransaction = function(sender, payments) {
      var 
        txDetails = generatePaymentDetails(sender, payments);
      return txDetails.valid ? createNewTransaction(txDetails, sender) : false;
    },
    // only called if details ARE valid
    createNewTransaction = function(txDetails, sender) {
      var 
        txIns = txDetails.txIns,
        txOuts = txDetails.txOuts,
        txId = getTxnIdHash(txIns, txOuts),
        signature = signTxn(txId, sender),
        // must unlock the unspent txIns before we can validate/use in txOuts
        unlockedTxIns = txIns.map(function(unspent) {
          unspent.signature = signature;
          return unspent;
        }),
        newTxn = txn(txId, unlockedTxIns, txOuts);
      
      return newTxn;
    },
    getTxOutData = function(payments) {
      var 
        payees = payments.map(function(payment) {
          return txOut(
            payment.receiver, 
            payment.amount
          );
        }),
        total = payees.reduce(function(total, aTxOut) {
          return total + aTxOut.amount;
        }, 0),
        valid = total > 0,
        result = {
          "payees": payees,
          "total": total,
          "valid": valid
        };
      //console.log("->getTxOutData", payments, payees, total, valid, result);
      return result;
    },
    getTxInData = function(amount) {
      var 
        total = 0,
        // fifo algo
        payers = unspentTxOutputs.filter(function(unspent) {
          if (amount > total) {
            total += unspent.amount;
            return true;
          } else {
            return false;
          }
        }),
        valid = total >= amount,
        result = {
          "total": total,
          "payers": payers,
          "valid": valid
        };
      //console.log("->getTxInData", amount, total, payers, valid, result);
      return result;
    },
    generatePaymentDetails = function(sender, payments) {
      var
        // out
        outData = getTxOutData(payments),
        outDataValid = outData.valid,
        totalOut = (outDataValid && outData.total) || 0,
        txOuts = (outDataValid && outData.payees) || [],
        // in
        inData = getTxInData(totalOut),
        inDataValid = inData.valid,
        totalIn = (inDataValid && inData.total) || 0,
        txIns = (inDataValid && inData.payers) || [],
        // any extra?
        extra = totalIn - totalOut,
        refund = extra > 0 ? [txOut(sender.publicKey, extra)] : [], 
        totalsValid = totalIn === (totalOut + extra),
        // result
        resultValid = outDataValid && inDataValid && totalsValid,
        result = {
          "txIns": txIns,
          "txOuts": txOuts.concat(refund),
          "valid": resultValid
        };
      //console.log("generatePaymentDetails", result);
      return result;
    },
    addTransaction = function(newTxn) {
      //console.log("addTransaction", newTxn);
      var 
        valid = validTransaction(newTxn);
      if (valid) {
        todoTransactions.push(newTxn);
      }
      return valid;
    },
    getTransactions = function(address, blockIndex) {
      //console.log("getTransactions = function(", address, ", ", blockIndex, ")");
      var 
        coinBaseTxn = getCoinbaseTransaction(address, blockIndex),
        validCoinBaseTxn = validCoinbaseTxn(coinBaseTxn, blockIndex),
        todos = todoTransactions.slice(0),
        result = [
          validCoinBaseTxn && coinBaseTxn
          // add any pending "unconfirmed" transactions:
        ].concat(todos);
      
      return result;
    },
    resetTransactions = function() {
      todoTransactions = [];
      unspentTxOutputs = [];
    },
    transactionAPI = {
      "getNewTransaction": getNewTransaction,
      "getCoinbaseTransaction": getCoinbaseTransaction,
      "getTransactions": getTransactions,
      "updateUnspentTxOuts": updateUnspentTxOuts,
      "addTransaction": addTransaction,
      "resetTransactions": resetTransactions
    };
  return transactionAPI;
}

module.exports = {
  "require": ["utils"],
  "init": function(context, config) {
    return getModule(context, config);
  }
};
