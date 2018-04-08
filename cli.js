#!/usr/bin/env node
var
  api = require("./index"),
  pm2 = require('pm2'),
  colors = require("colors"),
  fs = require('fs'),
  utf8 = require('utf8'),
  program = require('commander'),
  pkg = require('./package.json'),
  SERVER_SCRIPT = './server.js',
  version = pkg.version,
  make_red = function make_red(txt) {
    return colors.red(txt);
  },
  server,
  messageFromServer,
  port,
  args,
  conf,
  result,
  done;

program
  .version(version)
  .option('-s --server [command]', 'Server start/stop', /^(start|stop)$/i)
  .parse(process.argv);

web = program.web;
server = program.server;

if (server === "start") {
  // start
  /*
  if (serverApi.inst) {
    console.error("server already started...");
  } else {
    serverApi.start(
      pkg.server_config
    );
  }
  */
  // receive message from a slave
  messageFromServer = function(message) {
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
      case 'server-ready':
        console.log("MESSAGE:server-ready", data);
        process.exit(0);
        break;
      default:
        
        break;
    }
  };
  
  callback = function(err) {
    //console.log("callback", [].slice.call(arguments));
    if (err) {
      // TODO: handle this better?
      console.error(err);
    } else {
      // master control is online
      conf = pkg.server_config;
      port = conf.port;
      args = [
        '-s',
        'start',
        '-p',
        port
      ];
      
      pm2.start({
        // script location
        script: SERVER_SCRIPT,
        // give the slave a name
        name: 'server',
        args: args
      }, function(err, apps) {
        if (err) {
          // TODO: maybe handle this better?
          throw err;
        }
        console.log("server started...");
        
      });
      
      // set-up a message handler to process messages FROM slaves
      pm2.launchBus(function(err, bus) {
        bus.on('process:msg', messageFromServer);
        bus.on('log:out', function(data) {
          console.log(data.data);
        });
      });
    }
  };
  //pm2.connect(true, callback);
  pm2.connect(callback);

} else if (server === "stop") {
  // shutdown
  pm2.disconnect(function() {
    console.log("disconnected....");
    // kill the master controller and all slave miners
    pm2.killDaemon(function() {
      console.log("daemon killed....");
      process.exit(0);
    });
    // return control to the caller
    console.log("server shutdown...");
  });
} else {
  program.help();
  process.exit(0);
}
