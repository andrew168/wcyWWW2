/**
 * 主题库， 唯一的ID
 */

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

// 主题的ID，title，开始时间，结束时间等，创作者的id，名称，
var topicSchema = new Schema({
    title: {type: String, default: "no name"},
    description: {type: String},
    questionOpusId: Number,
    ssPath: Number,
    statTime:{type:Date},
    endTime:{type: Date},
    lastModified:{type:Date, default: Date.now},
    authorId:Number,
    authorName: {type: String},// 作者姓名和单位，冗余，以避免1次查作者库
    authorSchool: {type: String},
    // 申请共享，批准发表
    state: {type: Number, default: 10} // 10, 私有的,
});

function setup(autoIncrement) {
    topicSchema.plugin(autoIncrement.plugin, 'Topic');  // 自动添加_id字段
    mongoose.model('Topic', topicSchema); // 定义名为'Topic'的model，根据topicSchema
}

exports.setup = setup;
exports.schems = topicSchema;
