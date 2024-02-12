var JsSHA = require("jssha");

var getShaHash = function(rawString) {
  const shaObj = new JsSHA("SHA-1", "TEXT", { encoding: "UTF8" });
  shaObj.update(rawString);
  return shaObj.getHash("HEX");
};

exports.getShaHash = getShaHash;
