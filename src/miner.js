// miner.js
var 
  // pm2 is used to control the mining cluster
  pm2 = require('pm2'),
  // utils for timestamps, transactions, hashing, and templatizing
  utils = require("./utils"),
  // block for managing the blockchain
  block = require("./block"),
  // maximum nonce we can deal with in javascript without issues
  MAX_NUM = Number.MAX_SAFE_INTEGER,
  // path to script we'll use for our cluster of slave miners
  MINING_SLAVE_SCRIPT = './src/mining/slave.js',
  // will contain meta data for each slave miner in our cluster
  allMiners = [],
  // if we ever finish mining, this is where we'll go next
  miningCallback = function() {
    throw new Error("miningCallback:ERROR no miningCallback set!" + utils.stringify({"args":[].slice.call(arguments)}));
  },
  // the index of the block in the blockchain that we should mine ( -1 = OFF )
  currentMiningIndex = -1,
  // will pass each slave in the cluster to callback
  miningSlaves = function(callback) {
    allMiners.forEach(callback);
  },
  // receive message from a slave
  messageFromSlave = function(message) {
    var 
      // id is the pm_id of the slave
      id = message.process.pm_id,
      data = message.data,
      packet = data.packet,
      success = data.success,
      topic = data.topic;
    // handle each type of message
    switch (topic) {
      // one of the slaves finished mining a block
      case 'finished-mining':
        // do we have a winner? ( success on the correct block index )
        if (success && packet.newBlock.index === currentMiningIndex) {
          // reset current ( -1 = OFF )
          currentMiningIndex = -1;
          // add the newly mined block to the blockchain
          block.submitNewBlock(packet.newBlock);
          // inform other slaves to stop trying to mine this block
          miningSlaves(function(miner) {
            var 
              // id of this miner
              pm_id = miner.pm2_env.pm_id;
            // don't tell the winning miner to stop-mining, it already has...
            if (id !== pm_id) {
              // send the stop-mining message to all the losers
              pm2.sendDataToProcessId(pm_id, {
                topic: 'stop-mining',
                // show the losers what a winning packet looks like, so they suffer a little more...
                data: packet
              }, function(err, res) {
                // check to see if the losers cry about it...
                if (err) {
                  // TODO: maybe handle this better?
                  throw err;
                }
              });
            }
          });
          // hand control back to the process that requested we mine...
          miningCallback(packet);
        }
        break;
      case 'mining-error':
        // TODO: handle mining errors from slave
        console.error("mining-error slave[", id, "]", data.error.code, data.error.stack);
        console.log(utils.stringify(message));
        break;
      default:
        console.error("messageFromSlave:ERROR uknown topic", topic, message);
        break;
    }
  },
  // start up each slave miner in the cluster
  startSlaves = function(config) {
    var
      // the # of slaves to create for the cluster
      max = config.max || 1,
      // the size of the nonce partition for each slave
      offset = Math.floor(MAX_NUM / max),
      // when all slaves are started, we go here next
      ready = config.ready || function(miners) {
        console.log(miners.length + " miners started...");
      },
      // create one mining slave
      createMiner = function() {
        var 
          // the # of this slave
          num = allMiners.length;
        // should we create another one?
        if (num < max) {
          // yes, create a mining slave
          pm2.start({
            // script location
            script: MINING_SLAVE_SCRIPT,
            // give the slave a name
            name: 'miner_' + num
          }, function(err, apps) {
            if (err) {
              // TODO: maybe handle this better?
              throw err;
            }
            var 
              // meta data for the slave just created
              slave = apps[0],
              // the environment for the slave process
              env = slave.pm2_env,
              // slave name
              name = env.name,
              // slave process pid ( not the pm2 id, the actual system pid of the process )
              pid = slave.pid,
              // the pm2 id
              pm_id = env.pm_id,
              // calculate which section of the partitioned nonce space this slave should use
              slave_start_offset = offset * num,
              // create a human-readable handle with some slave specific info
              handle = name + " @ " + pid + "[ " + pm_id + " ] ( " + slave_start_offset + " )",
              // create the extra data we can include in a mined block
              extra = config.extra ? utils.getTemplatized(env, config.extra) : '';
            
            // this slave's index
            slave.slave_index = pm_id;
            // this slave's offset size
            slave.slave_offset_size = offset;
            // this slave's starting offset
            slave.slave_start_offset = slave_start_offset;
            // this slave's handle
            slave.handle = handle;
            // this slave's extra data
            slave.extra = extra;
            
            // save this slave's info in our lookup
            allMiners.push(slave);
            
            // create another slave later (next time around the event loop)
            setTimeout(createMiner, 1);
          });
        } else {
          // start-up completed and cluster is online, hand control back to caller
          ready(allMiners);
        }
      };
    
    // set-up a message handler to process messages FROM slaves
    pm2.launchBus(function(err, bus) {
      bus.on('process:msg', messageFromSlave);
      bus.on('log:out', function(data) {
        console.log(data.data);
      });
    });
    
    // start creating the 1st mining slave for the cluster
    createMiner();
  },
  // API - start the mining cluster (master controller and the mining slaves)
  start = function(conf) {
    var 
      // use any passed configuration options
      config = conf || {},
      // once the master control starts, we'll go here next
      callback = function(err) {
        if (err) {
          // TODO: handle this better?
          console.error(err);
        } else {
          // master control is online, start filling the cluster with slave miners
          startSlaves(config);
        }
      };
    // if we're testing set the master controller to die automatically if/when the script ends
    if (config.testing) {
      // non-daemon mode
      pm2.connect(true, callback);
    } else {
      // daemon mode is normal mode
      // the mining cluster stays online even if/when script dies
      // a restart will reconnect to anything still online
      pm2.connect(callback);
    }
  },
  // API - stop ( shutdown ) the mining cluster
  stop = function(callback) {
    // disconnect from pm2 service ( we have to do this 1st to fix stdin stdout logging )
    // see: https://github.com/Unitech/pm2/blob/master/lib/API.js#L231
    // the only place this.Client.close is called which is needed to disconnect
    // the socket we started with the pm2.launchBus call.
    // see: https://github.com/Unitech/pm2/blob/master/lib/Client.js#L186
    // this is directly contrary to the posted documentation for the api
    // which states you must use pm2.disconnect AFTER you kill it with pm2.killDaemon(errback)
    // see: http://pm2.keymetrics.io/docs/usage/pm2-api/#programmatic-api
    pm2.disconnect(function() {
      // kill the master controller and all slave miners
      pm2.killDaemon(function() {
        // forget our previous slaves:
        allMiners = [];
        // return control to the caller
        callback();
      });
    });
  },
  // API - try to mine a new block
  mine = function(data, difficulty, nonce, callback) {
    var
      // set up the mining difficulty ( number of zeros the hash must start with, zero == none )
      difficulty = difficulty || 0,
      // set up the nonce, a number incremented at each mining attempt ( this alters the resulting hash )
      nonce = nonce || 0,
      // if there's no difficulty, we don't even have to check for a good hash, we can just use whatever
      mining = difficulty ? true : false,
      // get the next available block index
      index = currentMiningIndex = block.getNextIndex(),
      // get the hash from the previous block ( this new blocks parent )
      previousHash = block.getPreviousHash(index),
      // get the current time
      timestamp = utils.getTimeStamp(),
      // calculate the transaction data
      transactionData = utils.getTransactionData(data.transactions || []),
      // good transactions ( valid )
      goodTransactionData = transactionData.good,
      // bad transactions ( invalid )
      badTransactionData = transactionData.bad;
    
    // set good transaction data
    data.transactions = goodTransactionData;
    
    // set the final callback so we can eventually return to the caller
    miningCallback = callback;
    
    // each slave in the cluster will try to mine a good hash using a nonce value that is 
    // WITHIN it's partition of the total nonce space ( 0 to Number.MAX_SAFE_INTEGER )
    // i.e. we partition the nonce space evenly for the # of slaves, then start each slave
    // mining using ONLY the nonce values within that space...
    // NOTE that the space is shifted by the random_nonce value passed-in by the caller
    miningSlaves(function(miningSlave) {
      var 
        // the id of the slave
        pm_id = miningSlave.pm2_env.pm_id,
        // calculate the starting nonce value for this slave
        slave_start_nonce = (nonce + miningSlave.slave_start_offset) % MAX_NUM,
        // create the new block object
        newBlock = {
          "index": index,
          "timestamp": timestamp,
          "difficulty": difficulty,
          "previousHash": previousHash,
          "data": data,
          "extra": miningSlave.extra,
          "nonce": slave_start_nonce
        },
        // set up the mining scratch-pad for the miner
        miningData = {
          handle: miningSlave.handle,
          slave_index: miningSlave.slave_index,
          slave_offset_size: miningSlave.slave_offset_size,
          slave_start_offset: miningSlave.slave_start_offset,
          random_nonce: nonce,
          slave_start_nonce: slave_start_nonce,
          miningAttempts: 0,
          difficulty: difficulty,
          timestamp: timestamp,
          lastReportTime: timestamp,
          pollInterval: 1000,
          newBlock: newBlock
        };

      // set the 1st hash on the new block
      newBlock.hash = utils.getObjectHash(newBlock);
      
      // send a start-mining message to this particular slave
      pm2.sendDataToProcessId(pm_id, {
        topic: 'start-mining',
        data: miningData,
      }, function(err, res) {
        if (err) {
          // TODO: maybe handle this better?
          throw err;
        }
      });
    });
  },
  // the public mining api to expose
  minerAPI = {
    "start": start,
    "stop": stop,
    "mine": mine
  };

module.exports = minerAPI;
