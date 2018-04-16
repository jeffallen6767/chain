// index.js
module.exports = {
  // callers need to supply an actual config object
  // or pass a string like "dev", "qa", "test", or "production"
  // to pull pre-made config from package.json
  "init": function(config) {
    var 
      fs = require('fs'),
      path = require('path'),
      api = {},
      basePath = require.resolve("./").replace("index.js", ""),
      srcPath = path.resolve(basePath, 'src'),
      files = fs.readdirSync(srcPath),
      finalConfig = typeof config === "string"
        ? require(path.resolve(basePath, './package.json')).config[config]
        : config;

    finalConfig.path = basePath;
    
    files.forEach(function(file) {
      var
        parts = file.split("."),
        key = parts[0],
        val = path.resolve(srcPath, file);
      if (fs.statSync(val).isFile()) {
        api[key] = require(val).init(api, finalConfig);
      } else {
      }
    });
    
    return api;
  }
};
