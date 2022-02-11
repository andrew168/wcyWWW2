var jsSHA = require('jssha');

var getShaHash = function (rawString) {
    shaObj = new jsSHA('SHA-1', 'TEXT', { encoding: "UTF8" });
    shaObj.update(rawString);
    return shaObj.getHash('HEX');
};

exports.getShaHash = getShaHash;
