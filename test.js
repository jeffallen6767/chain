var 
  context = require("./index"),
  tester = require("testing"),
  fs = require("fs"),
  testDir = "./tests",
  files = fs.readdirSync(testDir),
  tests = {},
  args = [].slice.call(process.argv),
  match = args.length > 1 && args[2] + ".js";

/*
args.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
});
*/

files.forEach(function(file) {
  if (!match || match == file) {
    var 
      testPath = [testDir, file].join("/"),
      testData = require(testPath),
      testKeys = Object.keys(testData);
    
    testKeys.forEach(function(testKey) {
      var 
        test = testData[testKey],
        key = [testPath, testKey].join(" - ");
      
      tests[key] = test;
    });
  }
});

tester.run(tests, context);
