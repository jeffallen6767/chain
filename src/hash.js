// hash.js
function getModule(context, config) {
  var 
    hashAPI = {
      "keccak": require("keccak-p-js")
    };
  return hashAPI;
}

module.exports = {
  "init": function(context, config) {
    return getModule(context, config);
  }
};
