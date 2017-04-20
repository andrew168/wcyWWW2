
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var userSchema = new Schema({
    // _id: 由autoIncrement.plugin自动添加的， 唯一递增正整数 > 0, 数据库记录自然编号
    name: {type: String, index: 1, required: true, unique: true},// 登录用的名字， 必须唯一，可以是email账号
    displayName: {type: String, default:""},
    psw: {type:String, required: true, default:"123abc"},
    score: {type: Number, default: 0} // 实时统计并显示？
});

function setup(autoIncrement) {
    userSchema.plugin(autoIncrement.plugin, 'User');
    mongoose.model('User', userSchema);
    console.log("required Paths:" + userSchema.requiredPaths());
    // console.log("indexes:" + userSchema.indexes());
}

exports.setup = setup;
