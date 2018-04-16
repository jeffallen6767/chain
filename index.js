var 
  fs = require('fs'),
  path = require('path'),
  basePath = process.cwd(),
  srcPath = path.resolve(basePath, 'src'),
  files = fs.readdirSync(srcPath);

module.exports = {
  "init": function(config) {
    var 
      api = {};
    config.path = basePath;
    //console.log("-->index.js basePath", basePath);
    files.forEach(function(file) {
      var
        parts = file.split("."),
        key = parts[0],
        val = path.resolve(srcPath, file);
      if (fs.statSync(val).isFile()) {
        //console.log("require and config FILE:", key, val);
        api[key] = require(val).init(api, config);
      } else {
        //console.log("skipping FOLDER:", key, val);
      }
    });
    return api;
  }
};
