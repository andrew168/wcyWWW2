/**
 * Created by Andrewz on 1/29/19.
 */
var express = require('express'),
  router = express.Router();

var headlines = [
  '拜年, 拒绝千篇一律',
  '我弄了个小程序，',
  '做了一个贺卡',
  '你也试一试？'

  // '祝您新年愉快，阖家欢乐！',
  // '"猪"事顺利，财源广进!',
  // '幸福平安, 吉祥如意！'
  // 'BONE教师邦参加教育创变者大会--“进深”， 四川 成都，2019.1.16',
  // '图话--用引擎技术助力教育创新'
];

router.get('/', function (req, res, next) {
    res.json(headlines);
});

module.exports = router;
