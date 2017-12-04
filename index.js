/* export all files in ./src dir */
var 
  fs = require('fs'),
  path = require('path'),
  basePath = process.cwd(),
  srcPath = path.resolve(basePath, 'src'),
  files = fs.readdirSync(srcPath),
  allFilesInSrcDir = files.reduce(function(acc, file, idx){
    var
      parts = file.split("."),
      key = parts[0],
      val = "./src/" + file;
    acc[key] = require(val);
    return acc;
  }, {});

module.exports = allFilesInSrcDir;
