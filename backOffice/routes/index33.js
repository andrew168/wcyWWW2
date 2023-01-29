var express = require('express');
var router = express.Router();

var logger = require('./../common/logger');
logger.config("udoido.log");

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log("index111.js is called");
  res.send("index33 is from node js");
});

/* GET home page. */
router.get('/aa', function(req, res, next) {
  var msg = "/aa in index33.js";
  console.log(msg);
  res.send(msg);
});

module.exports = router;
