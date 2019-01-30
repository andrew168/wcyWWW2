/**
 * Created by Andrewz on 1/29/19.
 */
var express = require('express'),
  router = express.Router();

var headlines = ['祝老师新年愉快，阖家欢乐！',
  'BONE教师邦参加教育创变者大会--“进深”',
  '图话--用引擎技术助力教育创新'
];

router.get('/', function (req, res, next) {
    res.json(headlines);
});

module.exports = router;
