// slave.js - a slave miner that runs in a cluster controlled by a master node
var 
  // we need utils for timestamps and hashing
  utils = require('../utils'),
  // when this slave came online
  start = Date.now(),
  // mining flag that shows when we've found a good hash
  blockMined = false, 
  // mining value that shows the blockchain index we should be working on ( -1 = OFF )
  miningIndex = -1,
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
        try {
          startMining(packet.data);
        } catch (e) {
          console.error(e);
        }
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
  // begin trying to mine for a good block using the miningData we got from master
  startMining = function(miningData) {
    // set a flag to show we haven't found a good block hash yet
    blockMined = false;
    // set a value to show the index of the block in the blockchain we should be working on
    miningIndex = miningData.newBlock.index;
    setOptimizer(miningData);
    // attempt to mine it
    mineOnce(miningData);
  },
  setOptimizer = function(miningData) {
    // prepare mining optimizer
    var 
      options = miningData.options;
    options.OPTIMIZED_MODE = {
      "parts": [],
      "partition": function(str) {
        var 
          parts = options.OPTIMIZED_MODE.parts = str.split(options.MINING_OPTIMIZER + options.hexNonce);
        parts[0] += options.MINING_OPTIMIZER;
        return parts;
      },
      "increment": function() {
        return utils.uInt32ToHex(miningData.current_nonce) + options.OPTIMIZED_MODE.parts[1];
      }
    };
    options.OPTIMIZED_MODE.hasher = utils.getOptimalHasher(options.OPTIMIZED_MODE);
    options.OPTIMIZED_MODE.hasher.prepare(miningData.freeBlock);
  },
  // make one attempt at mining a good hash for the current block:
  mineOnce = function(miningData) {
    // give it a go ( but catch any errors )
    try {
      // if we haven't found a good block yet, and we're 
      // still trying to mine the index the master says we should:
      if (!blockMined && miningIndex === miningData.newBlock.index) {
        blockMined = mineBlock(miningData);
      }
      // did we mine a good block?
      if (blockMined) {
        // reset the mining index ( off position )
        miningIndex = -1;
        // update progress
        updateProgress(miningData);
        // generate success message
        generateMiningSuccessMessage(miningData);
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
          // update progress
          updateProgress(miningData);
          // report progress
          reportProgress(miningData);
          // let event loop continue - so we can receive messages etc...
          setTimeout(function() {
            // now we're on the next trip around the event loop, continue mining...
            mineOnce(miningData);
          }, 1);
        }
      }
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
  },
  updateProgress = function(miningData) {
    var 
      // get the current time
      time = utils.getTimeStamp();
    // set the last report time to the current time
    miningData.lastReportTime = time;
    // calculate the elapsed time from current - start ( milliseconds )
    miningData.elapsed = (time - miningData.timestamp) / 1000;
    // calculate the # of calls to mineBlock per second
    miningData.perSecond = Math.round(miningData.miningAttempts / miningData.elapsed);
  },
  reportProgress = function(miningData) {
    // let the mining master how we're doing
    sendMessage({
      topic: 'report-progress',
      packet: {
        perSecond: miningData.perSecond,
        lastHash: miningData.newBlock.hash,
        lastNonce: utils.uInt32ToHex(miningData.current_nonce)
      }
    });
  },
  generateMiningSuccessMessage = function(miningData) {
    var 
      newBlock = miningData.newBlock;
    
    // latest zeta
    newBlock.zeta = [
      miningData.slave_extra, 
      utils.uInt32ToHex(miningData.current_nonce)
    ].join(miningData.optimize_zeta);

    miningData.msg = [
      miningData.handle,
      "MINED BLOCK[",
      newBlock.index,
      "] difficulty", 
      miningData.difficulty, 
      "in", 
      miningData.elapsed, 
      "seconds @", 
      miningData.perSecond, 
      "/per second, hash:", 
      newBlock.hash, 
      "zeta:",
      newBlock.zeta, 
      "miningAttempts:",
      miningData.miningAttempts
    ].join(" ");
  },
  // try to mine a block
  mineBlock = function(miningData) {
    var
      // the block we're trying to mine
      newBlock = miningData.newBlock,
      // slice off (difficulty) characters from start of hash
      test = newBlock.hash.slice(0, miningData.difficulty),
      // parse the slice as a base-16 (hexidecimal) value
      value = parseInt(test, 16),
      // compare result with zero ( zero == done )
      done = value === 0;
    
    // check to see if we still need to mine...
    if (!done) {
      // increment the number of mining attempts, check if we've reached our offset limit
      if (++miningData.miningAttempts % miningData.slave_offset_size) {
        // have we reached the integer limit for JavaScript?
        if (miningData.current_nonce === Number.MAX_SAFE_INTEGER) {
          // start over at zero
          miningData.current_nonce = 0;
        } else {
          // increment ( add one ) to the current nonce
          ++miningData.current_nonce;
        }
      } else {
        // end of offset, reset for another round of mining:
        newBlock.timestamp = utils.getTimeStamp();
        miningData.current_nonce = miningData.slave_start_nonce;
        delete newBlock.hash;
        miningData.freeBlock = JSON.parse(
          utils.stringify(newBlock)
        );
        setOptimizer(miningData);
      }
      
      // calc next hash
      newBlock.hash = miningData.options.OPTIMIZED_MODE.hasher.digest()
    }
    
    // return our status
    return done;
  };

// register a handler for any message we get from the master node:
process.on('message', getMessage);
