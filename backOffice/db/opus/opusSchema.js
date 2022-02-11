/**
 * Created by admin on 12/4/2015.
 * 作品库， 唯一的ID
 */

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

// 作品ID， XX时间，XX用户，创作的，模板作品的ID，
var opusSchema = new Schema({
    timestamp:{type:Date, default: Date.now},
    lastModified:{type:Date, default: Date.now},
    title: {type: String, default: ""},
    // 申请共享，批准发表
    state: {type: Number, default: 10}, // 10, 私有的,
    userId:Number, //应该是authorId，
    authorName: {type: String, default:""}, // 作者的displayName，冗余信息， 为了加速信息检索，避免由作者的id找
    topicId: Number,
    ssPath: {type: String, default:""},
    template: {type: Number, default: 0}, // 0: no template
    _id: Number,
}, { _id: false });

function setup(autoIncrement) {
    opusSchema.plugin(autoIncrement, { id: 'opus_id', inc_field: '_id', disable_hooks: true });  // 自动添加_id字段
    mongoose.model('Opus', opusSchema); // 定义名为'Opus'的model，根据opusSchema
}

exports.setup = setup;
exports.schems = opusSchema;
