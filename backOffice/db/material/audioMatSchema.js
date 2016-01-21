/**
 * Created by admin on 12/4/2015.
 * 图片资源库， 唯一的ID，名称格式： pXXXX.png
 */

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

// 图片ID， 原始文件名称，在XX时间，XX用户，从xxIP，上传的，公开的（缺省是false），
var audioMatSchema = new Schema({
    name: String,
    timestamp:{type:Date, default: Date.now},
    userId:Schema.ObjectId,
    ip: String,
    path: String,  // 素材在Server上的相对路径，去除host和MatFolder之后
    isShared: {type:Boolean, default:false},
    uploaded: {type:Boolean, default:false}
});

function setup(autoIncrement) {
    audioMatSchema.plugin(autoIncrement.plugin, 'AudioMat');  // 自动添加_id字段
    mongoose.model('AudioMat', audioMatSchema);
}

exports.setup = setup;
