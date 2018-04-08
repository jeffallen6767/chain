var
  express = require('express'),
  path = require('path'),
  chain = require('./index.js'),
  dir = __dirname,
  args = process.argv.slice(),
  staticPath = './public',
  sendMessage = function(data) {
    process.send({
      type: 'process:msg',
      data: data
    });
  },
  sendJson = function(res, data) {
    res.setHeader('Content-Type', 'application/json');
    res.send(
      JSON.stringify(
        typeof data === "object"
          ? data 
          : {"err": "no data"}
      )
    );
  },
  loadUsers = function(callback) {
    return chain.wallet.loadUsers(callback);
  },
  inst = null,
  start = function(ctx, callback) {
    var 
      app = express(),
      port = ctx.port,
      staticPath = path.join(dir, ctx.publicFolder),
      indexPath = path.join(staticPath, ctx.indexFile),
      cbk = typeof callback === 'function' ? callback : function() {
        console.log('Server listening on port ' + port);
      };

    app.use(
      express.static(staticPath)
    );

    app.get('/', function(req, res){
      res.sendFile(indexPath);
    });
    
    app.get('/loadUsers', function(req, res){
      loadUsers(function(data) {
        sendJson(res, {
          "users": data
        });
      });
    });
    
    serverApi.inst = app.listen(port, cbk);

    return serverApi.inst;
  },
  serverApi = {
    'inst': inst,
    'start': start
  };

module.exports = serverApi;

// if we're called from the cli in the proper manner, start-up
if (args.length > 3) {
  if (args[2] === "-s") {
    if (args[3] === "start") {
      if (args.length > 5) {
        if (args[4] === "-p") {
          port = args[5] - 0;
        }
        serverApi.start({
          "port": port,
          "publicFolder": "public",
          "indexFile": "index.html"
        }, function() {
          sendMessage({
            topic: 'server-ready',
            success: true,
            packet: args
          });
        });
      }
    }
  }
}
