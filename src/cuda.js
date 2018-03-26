// cuda.js
var 
  fs = require('fs'),
  // pm2 is used to control the mining cluster
  pm2 = require('pm2'),
  // utils for timestamps, transactions, hashing, and templatizing
  utils = require("./utils"),
  CUDA_TEST_SCRIPT = './cuda/test/test.exe',
  CUDA_TEST_OUT = './cuda/test/output.txt',
  CUDA_TEST_ERR = './cuda/test/error.txt',
  /////////////////////////////////////////////////
  TEXT = {
    "EMPTY": "",
    "NEW_LINE": "\r\n"
  },
  PARSER = [
    ["DRIVER_RUNTIME",/CUDA Driver Version \/ Runtime Version\s+(\d+.\d+)\s\/\s(\d+.\d+)/,["driver","runtime"]],
    ["CUDA_CAPABILITY",/CUDA Capability Major\/Minor version number:\s+(\d+.\d+)/,["capability"]],
    ["TOTAL_GLOBAL_MEMORY",/Total amount of global memory:\s+(\d+) MBytes \((\d+) bytes/,["mem_mbytes","mem_bytes"]],
    ["CUDA_CORES",/(\d+)\) Multiprocessors, \((\d+)\) CUDA Cores\/MP:\s+(\d+)/,["multiprocessors","cores_per_processor","cuda_cores"]],
    ["GPU_CLOCK",/GPU Max Clock rate:\s+(\d+) MHz \(([\d.]+) GHz\)/,["gpu_mhz","gpu_ghz"]],
    ["MEM_CLOCK",/Memory Clock rate:\s+(\d+) Mhz/,["mem_mhz"]],
    ["MEM_BUS",/Memory Bus Width:\s+(\d+)-bit/,["mem_bus_bits"]],
    ["L2_CACHE",/L2 Cache Size:\s+(\d+) bytes/,["l2_cache_bytes"]],
    ["CONSTANT_MEM",/Total amount of constant memory:\s+(\d+) bytes/,["constant_mem_bytes"]],
    ["SHARED_MEM",/Total amount of shared memory per block:\s+(\d+) bytes/,["shared_mem_per_block"]],
    ["BLOCK_REGISTERS",/Total number of registers available per block:\s+(\d+)/,["registers_per_block"]],
    ["WARP_SIZE",/Warp size:\s+(\d+)/,["warp_size"]],
    ["PROCESSOR_THREADS",/Maximum number of threads per multiprocessor:\s+(\d+)/,["threads_per_processor"]],
    ["BLOCK_THREADS",/Maximum number of threads per block:\s+(\d+)/,["threads_per_block"]],
    ["MEM_PITCH",/Maximum memory pitch:\s+(\d+) bytes/,["mem_pitch_bytes"]],
    ["TEXTURE_ALIGN",/Texture alignment:\s+(\d+) bytes/,["texture_align_bytes"]],
    ["DRIVER_MODE",/CUDA Device Driver Mode \(TCC or WDDM\):\s+(\w+)/,["driver_mode"]],
    ["UNIFIED_ADDRESSING",/Device supports Unified Addressing \(UVA\):\s+(\w+)/,["uva"]],
    ["RESULT",/Result = (\w+)/,["result"]]
  ].reduce(function(acc, val) {
    acc[val[0]] = {
      "regex": val[1],
      "handle": function(info) {
        ccd.apply(null,
          val[2].map(function(key, idx) {
            return [key, info[idx+1]];
          })
        );
      }
    };
    return acc;
  }, {
    // Detected 1 CUDA Capable device(s)
    "DETECT_DEVICES":{
      "regex": /Detected (\d+) CUDA Capable device/,
      "handle": function(info) {
        CUDA_INFO.num_devices = info[1] - 0;
        CUDA_INFO.devices = {};
      }
    },
    // Device 0: "GeForce GTX 1060 6GB"
    "NEW_DEVICE": {
      "regex": /Device (\d+): "([a-zA-Z0-9 ]+)"/,
      "handle": function(info) {
        var 
          key = info[1];
        CUDA_INFO.devices[key] = CUDA_CURRENT_DEVICE = {};
        ccd(
          ["key", key],
          ["name", info[2]]
        );
      }
    }
  }),
  PARSER_KEYS = Object.keys(PARSER),
  PARSER_NUM_KEYS = PARSER_KEYS.length,
  CUDA_INFO = {},
  CUDA_CURRENT_DEVICE,
  CUDA_PARSE_DONE,
  ccd = function() {
    [].slice.call(arguments).forEach(function(arg) {
      CUDA_CURRENT_DEVICE[arg[0]] = arg[1];
    });
  },
  parseCudaInfo = function(txt) {
    var 
      lines = txt.split(TEXT.NEW_LINE),
      u,v,w,
      x,y,z;
    lines.forEach(function(line, idx) {
      for (x=0; x<PARSER_NUM_KEYS; x++) {
        y = PARSER_KEYS[x];
        z = PARSER[y];
        u = z.regex.exec(line);
        if (u !== null) {
          z.handle(u);
          break;
        }
      }
    });
    CUDA_PARSE_DONE = true;
  },
  removeFiles = function() {
    if (fs.existsSync(CUDA_TEST_OUT)) {
      fs.unlinkSync(CUDA_TEST_OUT);
    }
    if (fs.existsSync(CUDA_TEST_ERR)) {
      fs.unlinkSync(CUDA_TEST_ERR);
    }
    // set-up a message handler to process messages FROM test.exe
    pm2.launchBus(function(err, bus) {
      bus.on('log:out', function(data) {
        //console.log("--->" + data.data);
        parseCudaInfo(data.data);
      });
    });
  },
  test = function(conf) {
    pm2.start({
      "script": CUDA_TEST_SCRIPT,
      "name": 'cuda-test',
      "out_file": CUDA_TEST_OUT,
      "error_file": CUDA_TEST_ERR,
      "combine_logs": true,
      "autorestart": false,
      "vizion": false
    }, function(err, apps) {
      if (err) {
        // TODO: maybe handle this better?
        throw err;
      }
      var next = function() {
        if (CUDA_PARSE_DONE) {
          conf.ready(CUDA_INFO);
        } else {
          setTimeout(next, 100);
        }
      };
      next();
    });
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
          removeFiles();
          test(conf);
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
    //console.log("CUDA_INFO", CUDA_INFO);
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
        //allMiners = [];
        // return control to the caller
        callback();
      });
    });
  },
  cudaAPI = {
    "start": start,
    "stop": stop
  };

module.exports = cudaAPI;

/*

[2018-03-25 03:15:33] PM2 log: --->C:\Users\jeffa\workspace\chain\cuda\test\test.exe Starting...

 CUDA Device Query (Runtime API) version (CUDART static linking)

Detected 1 CUDA Capable device(s)

Device 0: "GeForce GTX 1060 6GB"
  CUDA Driver Version / Runtime Version          9.1 / 9.1
  CUDA Capability Major/Minor version number:    6.1
  Total amount of global memory:                 6144 MBytes (6442450944 bytes)
  (10) Multiprocessors, (128) CUDA Cores/MP:     1280 CUDA Cores
  GPU Max Clock rate:                            1785 MHz (1.78 GHz)
  Memory Clock rate:                             4004 Mhz
  Memory Bus Width:                              192-bit
  L2 Cache Size:                                 1572864 bytes
  Maximum Texture Dimension Size (x,y,z)         1D=(131072), 2D=(131072, 65536), 3D=(16384, 16384, 16384)
  Maximum Layered 1D Texture Size, (num) layers  1D=(32768), 2048 layers
  Maximum Layered 2D Texture Size, (num) layers  2D=(32768, 32768), 2048 layers
  Total amount of constant memory:               65536 bytes
  Total amount of shared memory per block:       49152 bytes
  Total number of registers available per block: 65536
  Warp size:                                     32
  Maximum number of threads per multiprocessor:  2048
  Maximum number of threads per block:           1024
  Max dimension size of a thread block (x,y,z): (1024, 1024, 64)
  Max dimension size of a grid size    (x,y,z): (2147483647, 65535, 65535)
  Maximum memory pitch:                          2147483647 bytes
  Texture alignment:                             512 bytes
  Concurrent copy and kernel execution:          Yes with 2 copy engine(s)
  Run time limit on kernels:                     Yes
  Integrated GPU sharing Host Memory:            No
  Support host page-locked memory mapping:       Yes
  Alignment requirement for Surfaces:            Yes
  Device has ECC support:                        Disabled
  CUDA Device Driver Mode (TCC or WDDM):         WDDM (Windows Display Driver Model)
  Device supports Unified Addressing (UVA):      Yes
  Supports Cooperative Kernel Launch:            No
  Supports MultiDevice Co-op Kernel Launch:      No
  Device PCI Domain ID / Bus ID / location ID:   0 / 1 / 0
  Compute Mode:
     < Default (multiple host threads can use ::cudaSetDevice() with device simultaneously) >

deviceQuery, CUDA Driver = CUDART, CUDA Driver Version = 9.1, CUDA Runtime Version = 9.1, NumDevs = 1
Result = PASS


*/