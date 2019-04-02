/**
 * Created by Andrewz on 1/29/19.
 */
var express = require('express'),
  router = express.Router();

var headlines = [
  '《图话》新版特色：元件。元件是可以复用的，而且可以带有声音和动画。',
  '使用元件的好处。元件化的人物和道具，有动画、有声音，一次创作，到处可用，让创作更方便。',
  // '拜年, 拒绝千篇一律',
  // '我弄了个小程序，',
  // '做了一个贺卡',
  // '你也试一试？'

  // '祝您新年愉快，阖家欢乐！',
  // '"猪"事顺利，财源广进!',
  // '幸福平安, 吉祥如意！'
  // 'BONE教师邦参加教育创变者大会--“进深”， 四川 成都，2019.1.16',
  '图话--用动漫引擎技术助力教育创新'
];

router.get('/', function (req, res, next) {
    res.json(headlines);
});

module.exports = router;
