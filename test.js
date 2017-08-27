var 
  context = require("./index"),
  tester = require("testing"),
  fs = require("fs"),
  testDir = "./tests",
  files = fs.readdirSync(testDir),
  tests = {};

files.forEach(function(file) {
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
});

tester.run(tests, context);
