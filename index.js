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
        : config,
      // should we limit module inclusion?
      limitModules = Array.isArray(finalConfig.modules),
      allModules = {},
      required = [];

    finalConfig.path = basePath;
    
    files.forEach(function(file) {
      var
        parts = file.split("."),
        key = parts[0],
        val = path.resolve(srcPath, file),
        module;
      if (fs.statSync(val).isFile()) {
        module = allModules[key] = require(val);
        // if we're limiting modules, build a list of "required" modules
        if (limitModules && finalConfig.modules.indexOf(key) > -1) {
          if (required.indexOf(key) === -1) {
            required.push(key);
          }
          // does this module require any others?
          if (Array.isArray(module.require)) {
            module.require.forEach(function(moduleName) {
              if (required.indexOf(moduleName) === -1) {
                required.push(moduleName);
              }
            });
          }
        }
      }
    });
    
    // add required modules, or all of them if we're not limiting
    Object.keys(allModules).forEach(function(key) {
      if (!limitModules || required.indexOf(key) > -1) {
        api[key] = allModules[key].init(api, finalConfig);
      }
    });
    
    return api;
  }
};
