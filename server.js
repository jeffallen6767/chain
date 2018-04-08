var
  express = require('express'),
  path = require('path'),
  dir = __dirname,
  args = process.argv.slice(),
  sendMessage = function(data) {
    process.send({
      type: 'process:msg',
      data: data
    });
  },
  inst = null,
  start = function(ctx, callback) {
    var 
      app = express(),
      port = ctx.port,
      cbk = typeof callback === 'function' ? callback : function() {
        console.log('Server listening on port ' + port);
      };
/*
    app.use(
      express.static(staticPath)
    );

    app.get('/', function(req, res){
      res.sendFile(indexPath);
    });
*/
    serverApi.inst = app.listen(port, cbk);

    return serverApi.inst;
  },
  serverApi = {
    'inst': inst,
    'start': start
  };

module.exports = serverApi;

if (args.length > 3) {
  if (args[2] === "-s") {
    if (args[3] === "start") {
      if (args.length > 5) {
        if (args[4] === "-p") {
          port = args[5] - 0;
        }
        serverApi.start({
          "port": port
        }, function() {
          sendMessage({
            topic: 'ready',
            success: true,
            packet: args
          });
        });
      }
    }
  }
}

/*
 [ 'C:\\Program Files\\nodejs\\node.exe',
     'C:\\Users\\jeffa\\AppData\\Roaming\\npm\\node_modules\\pm2\\lib\\ProcessContainerFork.js',
     '-s',
     'start',
     '-p',
     '6767' ],
*/
/*
sendMessage({
  topic: 'ready',
  success: true,
  packet: args
});
*/
/*
args.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
});


*/