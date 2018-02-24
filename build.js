/* export all files in ./src dir to ./index.js */
var 
  fileName = "index.js",
  FILE_WARNING = "/" + "* WARNING: This file is auto-generated by build.js *" + "/",
  EXPORT_START = "module.exports = {",
  EXPORT_END = "}",
  NEW_LINE = "\n",
  SPACES = "  ",
  DOUBLE_QUOTE = '"',
  COLON = ":",
  fs = require('fs'),
  path = require('path'),
  basePath = process.cwd(),
  srcPath = path.resolve(basePath, 'src'),
  destPath = path.resolve(basePath, fileName),
  files = fs.readdirSync(srcPath),
  fileLines = [FILE_WARNING, EXPORT_START],
  fileText;

files.forEach(function(file) {
  var
    parts = file.split("."),
    key = parts[0],
    val = "./src/" + file;
  fileLines.push(
    [SPACES, DOUBLE_QUOTE, key, DOUBLE_QUOTE, COLON, "require(", DOUBLE_QUOTE, val, DOUBLE_QUOTE, "),"].join("")
  );
});

fileLines.push(EXPORT_END);

fileText = fileLines.join(NEW_LINE);

console.log(fileText);

fs.writeFileSync(destPath, fileText);
