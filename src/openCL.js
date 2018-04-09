// opencl.js
var 
  // opencl api
  cl = require("node-opencl"),
  // utils for timestamps, transactions, hashing, and templatizing
  utils = require("./utils"),
  // block for managing the blockchain
  block = require("./block"),
  // transaction for managing the transactions
  transaction = require("./transaction"),
  // environment vars
  env = process.env,
  // device identifier
  OPENCL_DEVICE_ID = null,
  // maximum nonce we can deal with in javascript without issues
  MAX_NUM = Number.MAX_SAFE_INTEGER,
  // a way to optimize mining speed
  MINING_OPTIMIZER = "::",
  // load the opencl mining script
  KERNEL_OPENCL = utils.readFile('./mining/keccak.cl'),
  // MARKER for "number of threads" replacement in opencl mining script
  KERNEL_OPENCL_THREADS = "{{num_threads}}",
  // # of threads to run in opencl mining
  KERNEL_OPENCL_NUM_THREADS = 20480,
  // MARKER for "number of slots in result for each thread" in opencl mining script
  KERNEL_OPENCL_SLOTS = "{{result_slots}}",
  // # of result slots in opencl mining
  KERNEL_OPENCL_NUM_SLOTS = 9,
  // # of bytes in uint32
  UINT32_BYTES = 4,
  // if we ever finish mining, this is where we'll go next
  miningCallback = function() {
    throw new Error("miningCallback:ERROR no miningCallback set!" + utils.stringify({"args":[].slice.call(arguments)}));
  },
  // the index of the block in the blockchain that we should mine ( -1 = OFF )
  currentMiningIndex = -1,
  // will hold stats sent back by mining slaves
  miningStats = {
    "miners": 1,
    "difficulty": 0,
    "data": {}
  },
  // will hold a ref to a reporting interval
  statReporter,
  // report the stats
  reportMiningStats = function() {
    console.log(
      miningStats.miners,
      "gpu miners@difficulty", 
      miningStats.difficulty, 
      "=",
      miningStats.data.perSecond,
      "/ sec -",
      miningStats.data.timestamp,
      "::",
      miningStats.data.lastNonce
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
  // API - try to mine a new block
  mine = function(options, callback) {
    // data, difficulty, nonce
    var
      num_gpu_threads = options.cores || KERNEL_OPENCL_NUM_THREADS,
      // keys
      keys = options.keys,
      // only the data field is required:
      data = options.data,
      // set up the mining difficulty ( number of zeros the hash must start with, zero == none )
      difficulty = miningStats.difficulty = options.difficulty || 0,
      // set up the nonce, a number incremented at each mining attempt ( this alters the resulting hash )
      nonce = options.nonce || 0,
      // create the extra data we can include in a mined block
      extra = options.extra ? [utils.getTemplatized(env, options.extra), OPENCL_DEVICE_ID].join("-") : '',
      // if there's no difficulty, we don't even have to check for a good hash, we can just use whatever
      mining = difficulty ? true : false,
      // get the next available block index
      index = currentMiningIndex = block.getNextIndex(),
      // get the hash from the previous block ( this new blocks parent )
      previousHash = block.getPreviousHash(index),
      // get the current time
      timestamp = utils.getTimeStamp(),
      // mine flag, false == abort mining
      continueMining = true,
      // calculate the starting nonce value for this slave
      slave_start_nonce = nonce % MAX_NUM,
      // calc hex value of nonce
      hexNonce = options.hexNonce = utils.uInt32ToHex(slave_start_nonce),
      // zeta is extra data + nonce
      zeta = [extra, hexNonce].join(MINING_OPTIMIZER),
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
        random_nonce: nonce,
        slave_start_nonce: slave_start_nonce,
        slave_extra: extra,
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
        ),
        handle: "opencl miner"
      },
      optiHasher,
      // create GPU context for this platform
      platform_spec = [cl.CONTEXT_PLATFORM, cl.getPlatformIDs()[0]],
      device_spec = cl.DEVICE_TYPE_GPU,
      context_spec = cl.CONTEXT_DEVICES,
      context = cl.createContextFromType(platform_spec, device_spec, null, null),
      devices = cl.getContextInfo(context, context_spec),
      device = devices[0],
      // source of opencl kernel
      programSource = KERNEL_OPENCL.replace(
        KERNEL_OPENCL_THREADS, num_gpu_threads
      ).replace(
        KERNEL_OPENCL_SLOTS, KERNEL_OPENCL_NUM_SLOTS
      ),
      program, 
      kernel,
      pointer,
      outSize = num_gpu_threads * KERNEL_OPENCL_NUM_SLOTS * UINT32_BYTES, 
      outState = new ArrayBuffer(outSize),
      outBuffer = new Uint32Array(outState),
      outBufferMem,
      inBuffer,
      inBufferMem,
      inSize = 200,
      queue,
      dataview,
      prepareToMine,
      mineOnce;
    
    // prefill the buffer with zeros
    outBuffer.fill(0);
    
    // set good transaction data
    data.transactions = transaction.getTransactions(keys.publicKey, index);
    
    // set the final callback so we can eventually return to the caller
    miningCallback = callback;
    
    // if difficulty is NOT zero we need to mine...
    if (difficulty) {
      
      // save the current difficulty & # of miners for reporting
      miningStats.difficulty = difficulty;
      miningStats.miners = num_gpu_threads;
      
      // start the periodic reporter:
      startReporting(options.pollInterval || 1000);
      
      // prepare mining optimizer
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
      
      // the main mining set-up routine creates buffers and opencl program
      prepareToMine = function() {
        // get an optimized hasher
        optiHasher = options.OPTIMIZED_MODE.hasher = utils.getOptimalHasher(options.OPTIMIZED_MODE);
        // prep the hasher
        optiHasher.prepare(newBlock);
        // grab a copy of the prepped data for the gpu miners
        inBuffer = options.OPTIMIZED_MODE.cache.buffer.slice();
        // need to point to the 'next' byte to write in buffer
        pointer = options.OPTIMIZED_MODE.cache.pt;
        // size of input
        inSize = inBuffer.length;

        // Create opencl program from source code
        program = cl.createProgramWithSource(
          context, 
          programSource
        );

        try {
          // build program
          cl.buildProgram(program);
          // create kernel
          kernel = cl.createKernel(program, "search");
        }
        catch(err) {
          console.error(
            cl.getProgramBuildInfo(program, device, cl.PROGRAM_BUILD_LOG)
          );
          process.exit(-1);
        }
        
        // MEM_WRITE_ONLY: can contain a nonce (1 x uInt32) and a winning hash (8 x uInt32s)
        outBufferMem = cl.createBuffer(context, cl.MEM_WRITE_ONLY | cl.MEM_USE_HOST_PTR, outSize, outBuffer);
        
        // MEM_READ_ONLY: contains starting byte values
        inBufferMem = cl.createBuffer(context, cl.MEM_READ_ONLY | cl.MEM_USE_HOST_PTR, inSize, inBuffer);
        
        // Set kernel args
        cl.setKernelArg(kernel, 0, "uint*", outBufferMem);
        cl.setKernelArg(kernel, 1, "uchar*", inBufferMem);
        cl.setKernelArg(kernel, 2, "uint", pointer);
        cl.setKernelArg(kernel, 3, "uchar", difficulty);
        
        // main mining 'loop', one round will mine on N gpu threads at once
        mineOnce = function() {
          
          // this advances (amount == number of threads) every time around the 'mineOnce' loop
          cl.setKernelArg(kernel, 4, "uint", miningData.current_nonce);

          // Create command queue
          if (cl.createCommandQueueWithProperties !== undefined) {
            // OpenCL 2
            queue = cl.createCommandQueueWithProperties(context, device, []);
          } else {
            // OpenCL 1.x
            queue = cl.createCommandQueue(context, device, null);
          }
          
          // set the queue for N kernel threads
          cl.enqueueNDRangeKernel(queue, kernel, 1, null, [num_gpu_threads], null);
          
          // set the incoming results buffer
          cl.enqueueReadBuffer(queue, outBufferMem, true, 0, outSize, outBuffer); 
          
          // wait for all the threads to finish
          cl.finish(queue);
          
          // check the results
          for (x=0; x<num_gpu_threads; x++) {
            // index into result data
            y = x * KERNEL_OPENCL_NUM_SLOTS;
            // possible winning nonce?
            z = outBuffer[y];
            if (z) {
              // yes! we have a winner, also parse the hash
              dataview = new DataView(outBuffer.buffer);
              f = [];
              y += 1;
              // grab all 8 uint32 values
              for (r=0; r<8; r++) {
                q = y + r;
                // break into bytes
                for (p=0; p<4; p++) {
                  l = q * 4;
                  m = l + p;
                  n = dataview.getUint8(m);
                  // hex value
                  k = n.toString(16);
                  i = k.length;
                  j = "00".substr(i) + k;
                  f.push(j);
                }
              }
              newBlock.hash = f.join('');
              miningData.current_nonce = z;
              // latest zeta
              newBlock.zeta = [
                miningData.slave_extra, 
                utils.uInt32ToHex(miningData.current_nonce)
              ].join(miningData.optimize_zeta);
              // we've got a good one, exit loop
              break;
            }
          }
          miningData.miningAttempts += num_gpu_threads;
          // get the current time
          timeStamp = utils.getTimeStamp();
          // set the last report time to the current time
          miningData.lastReportTime = timeStamp;
          // calculate the elapsed time from current - start ( milliseconds )
          miningData.elapsed = (timeStamp - miningData.timestamp) / 1000;
          // calculate the # of calls to mineBlock per second
          miningData.perSecond = Math.round(miningData.miningAttempts / miningData.elapsed);
          // update stats
          miningStats.data = {
            timestamp: newBlock.timestamp,
            perSecond: miningData.perSecond,
            lastNonce: utils.uInt32ToHex(miningData.current_nonce)
          };
          // did we win?
          if (dataview) {
            // success
            // reset current ( -1 = OFF )
            currentMiningIndex = -1;
            // add the newly mined block to the blockchain
            block.submitNewBlock(newBlock);
            // update mining message
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
            // cleanup
            // test release each CL object
            cl.releaseCommandQueue(queue);
            cl.releaseKernel(kernel);
            cl.releaseProgram(program);
            cl.releaseMemObject(outBufferMem);
            cl.releaseMemObject(inBufferMem);
            cl.releaseContext(context);
            // hand control back to the process that requested we mine...
            doneMining(miningData);
          } else {
            // keep mining...
            cl.releaseCommandQueue(queue);
            miningData.current_nonce += num_gpu_threads;
            if (miningData.current_nonce > MAX_NUM) {
              // reset for another round of mining
              miningData.current_nonce = 0;
              newBlock.timestamp = timeStamp;
              cl.releaseMemObject(inBufferMem);
              cl.releaseKernel(kernel);
              cl.releaseProgram(program);
              cl.releaseMemObject(outBufferMem);
              cl.releaseMemObject(inBufferMem);
              cl.releaseContext(context);
              setTimeout(prepareToMine, 1);
            } else {
              setTimeout(mineOnce, 1);
            }
          }
        };
        mineOnce();
      };
      prepareToMine();
    } else {
      // no difficulty:
      newBlock.hash = utils.getObjectHash(newBlock);
      console.log("no difficulty", "newBlock.hash", newBlock.hash);
      doneMining(miningData);
    }
  },
  
  start = function(conf) {
    var 
      // create GPU context for this platform
      platform_spec = [cl.CONTEXT_PLATFORM, cl.getPlatformIDs()[0]],
      device_spec = cl.DEVICE_TYPE_GPU,
      context_spec = cl.CONTEXT_DEVICES,
      context = cl.createContextFromType(platform_spec, device_spec, null, null);
      devices = cl.getContextInfo(context, context_spec),
      device = devices[0];
    
    if (conf.max) {
      KERNEL_OPENCL_NUM_THREADS = conf.max;
    }
    
    OPENCL_DEVICE_ID = [
      'opencl mining device:',
      cl.getDeviceInfo(device, cl.DEVICE_VENDOR).trim(),
      cl.getDeviceInfo(device, cl.DEVICE_NAME)
    ].join('');
    
    console.log("OPENCL_DEVICE_ID", OPENCL_DEVICE_ID);
    
    conf.ready(KERNEL_OPENCL_NUM_THREADS);
  },
  
  stop = function(callback) {
    // noop
    callback("done opencl mining...");
  },
  
  openCL_API = {
    "start": start,
    "mine": mine,
    "stop": stop
  };

module.exports = openCL_API;
