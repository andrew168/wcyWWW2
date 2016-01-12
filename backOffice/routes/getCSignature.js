/**
 * Created by admin on 11/21/2015.
 */
var express = require('express');
var router = express.Router();
var cSignature = require('../common/cSignature'); // 后缀.js可以省略，Node会自动查找，

var createNonceStr = function () {
    return Math.random().toString(36).substr(2, 15);
};

var app = require('../app');
/* GET users listing. */
router.get('/', function(req, res, next) {
    var data = {
//        nonceStr: createNonceStr(),
        public_id: req.query.filename || "no_filename"
        // tag: 'tag'
    };

    cSignature.sign(data);  //data.s = signature;

    console.log(req);
    // app.set('json spaces', 4);
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    res.json(data);
});

module.exports = router;
