// miner.js
function getModule(context, config) {
  var 
    // pm2 is used to control the mining cluster
    pm2 = require('pm2'),
    // from context:
    utils = context.utils(),
    block = context.block(),
    transaction = context.transaction(),
    // pm2 meta info
    pm2_meta_info = null,
    // will be callback when configuring slave
    slaveConfigureCallback,
    // maximum nonce we can deal with in javascript without issues
    MAX_NUM = Number.MAX_SAFE_INTEGER,
    // path to script we'll use for our cluster of slave miners
    MINING_SLAVE_SCRIPT = require.resolve('./mining/slave.js'),
    // a way to optimize mining speed
    MINING_OPTIMIZER = "::",
    // will contain meta data for each slave miner in our cluster
    allMiners = [],
    // if we ever finish mining, this is where we'll go next
    miningCallback = function() {
      throw new Error(
        "miningCallback:ERROR no miningCallback set!"
          + utils.stringify({
              "args": [].slice.call(arguments)
            })
      );
    },
    // the index of the block in the blockchain that we should mine ( -1 = OFF )
    currentMiningIndex = -1,
    // will pass each slave in the cluster to callback
    miningSlaves = function(callback) {
      allMiners.forEach(callback);
    },
    // will hold stats sent back by mining slaves
    miningStats = {
      "difficulty": 0,
      "data": []
    },
    // will hold a ref to a reporting interval
    statReporter,
    // prep stats for reporting
    getStats = function() {
      var
        data = miningStats.data,
        num = data.length,
        dif = miningStats.difficulty,
        cut = -1 * dif,
        dat = {
          "perSecond": 0,
          "lastHash": []
        },
        stats = {
          "num": num,
          "dif": dif,
          "dat": dat
        };
      data.forEach(function(vals) {
        dat.perSecond += (vals.perSecond || 0);
        dat.lastHash.push(
          vals.lastNonce + "=" + (vals.lastHash || '????????????????').slice(cut)
        );
      });
      return stats;
    },
    // report the stats
    reportMiningStats = function() {
      var 
        stats = getStats();
      console.log(
        stats.num,
        "miners@", 
        stats.dif, 
        "=",
        stats.dat.perSecond,
        "/ sec -",
        stats.dat.lastHash.join("  ")
      );
    },
    // when we finish mining stop reporting and hand control back to the caller
    doneMining = function(packet) {
      stopReporting();
      miningCallback(packet);
    },
    // start reporting mining stats
    startReporting = function(mills) {
      stopReporting();
      statReporter = setInterval(reportMiningStats, mills);
    },
    // stop reporting mining stats
    stopReporting = function() {
      clearInterval(statReporter);
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
        // one of the slaves finished config-setup
        case 'finished-config':
          slaveConfigureCallback(data);
          break;
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
            doneMining(packet);
          }
          break;
        case 'report-progress':
          //console.log(utils.stringify(message));
          miningStats.data[id] = packet;
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
    startSlaves = function(startConfig) {
      var
        // the # of slaves to create for the cluster
        max = startConfig.max || 1,
        // the size of the nonce partition for each slave
        offset = Math.floor(MAX_NUM / max),
        // when all slaves are configured, we are ready...
        ready = startConfig.ready || function(miners) {
          console.log(miners.length + " miners started...");
        },
        // when slaves are started, we configure them
        configure = function(miners) {
          var 
            num = miners.length;
          slaveConfigureCallback = function(msg) {
            //console.log("num", num, "msg", msg);
            if (--num === 0) {
              ready(miners);
            }
          };
          // send config message to each miner
          miners.forEach(function(miner) {
            var pm_id = miner.pm2_env.pm_id;
            pm2.sendDataToProcessId(pm_id, {
              topic: 'config',
              data: config,
            }, function(err, res) {
              if (err) {
                // TODO: maybe handle this better?
                console.error("err with miner configure", pm_id, config);
                throw err;
              }
            });
          });
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
                extra = startConfig.extra ? utils.getTemplatized(env, startConfig.extra) : '';
              
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
            configure(allMiners);
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
        startConfig = conf || {},
        // once the master control starts, we'll go here next
        callback = function(err, meta) {
          if (err) {
            // TODO: handle this better?
            console.error(err);
          } else {
            /*
            meta = {
                "new_pm2_instance":false,
                "pm2_home":"C:\\Users\\jeffa\\.pm2",
                "pub_socket_file":"\\\\.\\pipe\\pub.sock",
                "rpc_socket_file":"\\\\.\\pipe\\rpc.sock"
            }
            */
            pm2_meta_info = meta;
            // master control is online, start filling the cluster with slave miners
            startSlaves(startConfig);
          }
        };
      // if we're testing set the master controller to die automatically if/when the script ends
      if (startConfig.testing) {
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
      var
        numMiners = allMiners.length,
        finished = function() {
          pm2.disconnect(function() {
            //console.log("-------------------------->>>> pm2 disconnected....", pm2_meta_info.new_pm2_instance, [].slice.call(arguments));
            // return control to the caller
            callback("done cpu mining...");
            if (pm2_meta_info.new_pm2_instance) {
              // if we started it, we stop it
              setTimeout(function() {
                pm2.killDaemon(function() {
                  // noop
                });
              }, 1000);
            }
          });
        };
      if (numMiners) {
        allMiners.forEach(function(miner, idx) {
          var
            id = miner.slave_index;
          pm2.delete(id, function() {
            console.log("pm2.delete", id, [].slice.call(arguments));
            if (--numMiners === 0) {
              allMiners = [];
              finished();
            }
          });
        });
      } else {
        finished();
      }
    },
    // API - try to mine a new block
    mine = function(options, callback) {
      // data, difficulty, nonce
      var
        // keys
        keys = options.keys,
        // only the data field is required:
        data = options.data,
        // set up the mining difficulty ( number of zeros the hash must start with, zero == none )
        difficulty = options.difficulty || 0,
        // set up the nonce, a number incremented at each mining attempt ( this alters the resulting hash )
        nonce = options.nonce || 0,
        // if there's no difficulty, we don't even have to check for a good hash, we can just use whatever
        mining = difficulty ? true : false,
        // get the next available block index
        index = currentMiningIndex = block.getNextIndex(),
        // get the hash from the previous block ( this new blocks parent )
        previousHash = block.getPreviousHash(index),
        // get the current time
        timestamp = utils.getTimeStamp(),
        // mine flag, false == abort mining
        continueMining = true;

      // set good transaction data
      data.transactions = transaction.getTransactions(keys.publicKey, index);
      
      // set the final callback so we can eventually return to the caller
      miningCallback = callback;
      
      // save the current difficulty for reporting
      miningStats.difficulty = difficulty;
      
      // start the periodic reporter:
      startReporting(options.pollInterval || 1000);
      
      // each slave in the cluster will try to mine a good hash using a nonce value that is 
      // WITHIN it's partition of the total nonce space ( 0 to Number.MAX_SAFE_INTEGER )
      // i.e. we partition the nonce space evenly for the # of slaves, then start each slave
      // mining using ONLY the nonce values within that space...
      // NOTE that the space is shifted by the random_nonce value passed-in by the caller
      miningSlaves(function(miningSlave) {
        if (continueMining) {
          var 
            // the id of the slave
            pm_id = miningSlave.pm2_env.pm_id,
            // calculate the starting nonce value for this slave
            slave_start_nonce = (nonce + miningSlave.slave_start_offset) % MAX_NUM,
            // zeta is extra data + nonce
            hexNonce = options.hexNonce = utils.uInt32ToHex(slave_start_nonce),
            zeta = [miningSlave.extra, hexNonce].join(MINING_OPTIMIZER),
            // create the new block object
            newBlock = {
              "index": index,
              "timestamp": timestamp,
              "difficulty": difficulty,
              "previousHash": previousHash,
              "data": data,
              "zeta": zeta
            },
            // set up the mining scratch-pad for the miner
            miningData = {
              options: options,
              optimize_zeta: MINING_OPTIMIZER,
              handle: miningSlave.handle,
              slave_index: miningSlave.slave_index,
              slave_offset_size: miningSlave.slave_offset_size,
              slave_start_offset: miningSlave.slave_start_offset,
              random_nonce: nonce,
              slave_start_nonce: slave_start_nonce,
              slave_extra: miningSlave.extra,
              current_nonce: slave_start_nonce,
              miningAttempts: 0,
              difficulty: difficulty,
              timestamp: timestamp,
              lastReportTime: timestamp,
              pollInterval: 1000,
              newBlock: newBlock,
              transactions: data.transactions,
              freeBlock: JSON.parse(
                utils.stringify(newBlock)
              )
            },
            optiHasher;

          // prepare mining optimizer
          options.MINING_OPTIMIZER = MINING_OPTIMIZER;
          options.OPTIMIZED_MODE = {
            "parts": [],
            "partition": function(str) {
              var 
                parts = options.OPTIMIZED_MODE.parts = str.split(MINING_OPTIMIZER + hexNonce);
              parts[0] += MINING_OPTIMIZER;
              return parts;
            },
            "increment": function() {
              return utils.uInt32ToHex(miningData.current_nonce) + options.OPTIMIZED_MODE.parts[1];
            }
          };
          optiHasher = options.OPTIMIZED_MODE.hasher = utils.getOptimalHasher(options.OPTIMIZED_MODE);
          optiHasher.prepare(newBlock);

          newBlock.hash = optiHasher.digest();
          
          // if difficulty is NOT zero we need to mine...
          if (difficulty) {
            // send a start-mining message to this particular slave
            pm2.sendDataToProcessId(pm_id, {
              topic: 'start-mining',
              data: miningData,
            }, function(err, res) {
              if (err) {
                // TODO: maybe handle this better?
                console.log("err with miningData", miningData);
                throw err;
              }
            });
          } else {
            // no difficulty, so any hash will do
            // add the newly mined block to the blockchain
            block.submitNewBlock(newBlock);
            // abort mining:
            continueMining = false;
            // reset current ( -1 = OFF )
            currentMiningIndex = -1;
            miningData.msg = "No mining necessary...";
            // unwind stack, THEN hand control back to the process that requested we mine...
            setImmediate(function() {
              doneMining(miningData);
            });
          }
        }
      });
    },
    // the public mining api to expose
    minerAPI = {
      "start": start,
      "stop": stop,
      "mine": mine
    };
  return minerAPI;
}

module.exports = {
  "require": ["utils", "block", "transaction"],
  "init": function(context, config) {
    return getModule(context, config);
  }
};
