// slave.js - a slave miner that runs in a cluster controlled by a master node
var 
  // we need utils for timestamps and hashing
  utils = require('../utils'),
  // when this slave came online
  start = Date.now(),
  // send message to master node
  sendMessage = function(data) {
    process.send({
      type: 'process:msg',
      data: data
    });
  },
  // receive message from master node
  getMessage = function(packet) {
    // what type of message did we get?
    switch (packet.topic) {
      case 'start-mining':
        // do what the master says, start mining using the received data
        startMining(packet.data);
        break;
      case 'stop-mining':
        // reset the mining index ( off position )
        miningIndex = -1;
        break;
      default:
        console.error("getMessage:ERROR unknown packet.topic", packet.topic, packet);
        break;
    }
  },
  // mining flag that shows when we've found a good hash
  blockMined = false, 
  // mining value that shows the blockchain index we should be working on ( -1 = OFF )
  miningIndex = -1,
  // begin trying to mine for a good block using the miningData we got from master
  startMining = function(miningData) {
    // set a flag to show we haven't found a good block hash yet
    blockMined = false;
    // set a value to show the index of the block in the blockchain we should be working on
    miningIndex = miningData.newBlock.index;
    // attempt to mine it
    mineOnce(miningData);
  },
  // make one attempt at mining a good hash for the current block:
  mineOnce = function(miningData) {
    // if we haven't found a good block yet, and we're 
    // still trying to mine the index the master says we should:
    if (!blockMined && miningIndex === miningData.newBlock.index) {
      // give it a go ( but catch any errors )
      try {
        blockMined = mineBlock(miningData);
      } catch (e) {
        // reset the mining index ( off position )
        miningIndex = -1;
        // let the mining master know we've got a problem
        sendMessage({
          topic: 'mining-error',
          success: false,
          error: {
            code: e.code, 
            stack: e.stack
          },
          packet: miningData
        });
      }
    }
    // did we mine a good block?
    if (blockMined) {
      // reset the mining index ( off position )
      miningIndex = -1;
      // let the mining master know we've mined a block:
      sendMessage({
        topic: 'finished-mining',
        success: blockMined,
        packet: miningData
      });
    } else if (miningIndex == miningData.newBlock.index) {
      // we didn't find a good block, but 
      // we're still mining the correct index, should we suspend computation?
      if (miningData.miningAttempts % miningData.pollInterval) {
        // we've still got time to mine more on this trip around the event loop
        mineOnce(miningData);
      } else {
        // let event loop continue - so we can receive messages etc...
        setTimeout(function() {
          // now we're on the next trip around the event loop, continue mining...
          mineOnce(miningData);
        }, 1);
      }
    }
  },
  // try to mine a block
  mineBlock = function(miningData) {
    var
      // number of zeros the hash must start with
      difficulty = miningData.difficulty,
      // the block we're trying to mine
      newBlock = miningData.newBlock,
      // slice off (difficulty) characters from start of hash
      test = newBlock.hash.slice(0, difficulty),
      // parse the slice as a base-16 (hexidecimal) value
      value = parseInt(test, 16),
      // compare result with zero ( zero == done )
      done = value === 0,
      // get the current time
      time = utils.getTimeStamp();
    
    // check to see if we still need to mine...
    if (!done) {
      // increment the number of mining attempts, check if we've reached our offset limit
      if (++miningData.miningAttempts % miningData.slave_offset_size) {
        // have we reached the integer limit for JavaScript?
        if (newBlock.nonce === Number.MAX_SAFE_INTEGER) {
          // start over at zero
          newBlock.nonce = 0;
        } else {
          // increment ( add one ) to the current nonce
          newBlock.nonce++;
        }
      } else {
        // end of offset, reset for another round of mining:
        newBlock.timestamp = utils.getTimeStamp();
        newBlock.nonce = miningData.slave_start_nonce;
      }

      // calculate a new hash for the block
      newBlock.hash = utils.getObjectHash(newBlock);
    }
    
    // should we report progress?
    if (done || (time - miningData.lastReportTime > 1000)) {
      // set the last report time to the current time
      miningData.lastReportTime = time;
      // calculate the elapsed time from current - start ( milliseconds )
      miningData.elapsed = (time - miningData.timestamp) / 1000;
      // calculate the # of calls to mineBlock per second
      miningData.perSecond = Math.round(miningData.miningAttempts / miningData.elapsed);
      // TODO: report the current statistics
      //console.log("mining difficulty", difficulty, "@", perSecond, "/per second", newBlock.hash, newBlock.nonce);
    }

    // we're done if we've actually found a good hash for a block
    if (done) {
      // we're done mining...generate a 'success' message
      miningData.msg = [
        miningData.handle,
        "MINED BLOCK[",
        newBlock.index,
        "] difficulty", 
        difficulty, 
        "in", 
        miningData.elapsed, 
        "seconds @", 
        miningData.perSecond, 
        "/per second, hash:", 
        newBlock.hash, 
        "nonce:",
        newBlock.nonce, 
        "miningAttempts:",
        miningData.miningAttempts
      ].join(" ");
    }
    
    // return our status
    return done;
  };

// register a handler for any message we get from the master node:
process.on('message', getMessage);
