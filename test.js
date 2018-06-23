var 
  config = require("./package.json").config.test,
  context = require("./index.js").init(config),
  tester = require("testing"),
  fs = require("fs"),
  testDir = config.tests.path,
  files = fs.readdirSync(testDir),
  tests = {},
  args = [].slice.call(process.argv),
  match = args.length > 2 ? args[2] + ".js" : false;
  
console.log(match ? "testing only: " + match : "testing all...");

// iterate over all test files
files.forEach(function(file) {
  // if we are running all tests or just one test that matches
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
