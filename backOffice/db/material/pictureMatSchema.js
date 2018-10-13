/**
 * Created by admin on 12/4/2015.
 * 图片资源库， 唯一的ID，名称格式： pXXXX.png
 */

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

// 图片ID， 原始文件名称，在XX时间，XX用户，从xxIP，上传的，公开的（缺省是false），
var pictureMatSchema = new Schema({
    name: String,
    timestamp:{type:Date, default: Date.now},
    userId: Number, // 上传者的ID， 认为：上传者就是创作者，
    typeId: Number, // 10:背景图， in material.js
    ip: String,
    path: String,  // 素材在Server上的相对路径，去除host和MatFolder之后
    isShared: {type:Boolean, default:false}, //个人私有/与众共享
    isBanned: {type: Boolean, default: false},// 禁止， 任何人都看不到， 包括自己
    requestToBan: {type: Boolean, default: false},// 用户或粗审员请求禁止
    requestToShare: {type: Boolean, default: false},// 用户或粗审员请求分享
    topicIds: {type: Array, default:[]},
    uploaded: {type:Boolean, default:false}
});

function setup(autoIncrement) {
    pictureMatSchema.plugin(autoIncrement.plugin, 'PictureMat');  // 自动添加_id字段
    mongoose.model('PictureMat', pictureMatSchema);
}

exports.setup = setup;
exports.schema = pictureMatSchema;
