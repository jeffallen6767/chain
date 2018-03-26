// openCL.js
var 
  fs = require('fs'),
  // pm2 is used to control the mining cluster
  //pm2 = require('pm2'),
  // utils for timestamps, transactions, hashing, and templatizing
  utils = require("./utils"),
  
  test = function(conf) {
    var 
      nooocl = require('nooocl'),
      CLHost = nooocl.CLHost,
      host = CLHost.createV12(),
      hostVersion = host.cl.version;
    
    console.log("hostVersion", hostVersion);
    
    conf.ready();
  },

  openCL_API = {
    "test": test
  };

module.exports = openCL_API;
