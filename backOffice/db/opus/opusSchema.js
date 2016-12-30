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
    userId:Number,
    ssPath: {type: String, default:""},
    template: {type: Number, default: 0} // 0: no template
});

function setup(autoIncrement) {
    opusSchema.plugin(autoIncrement.plugin, 'Opus');  // 自动添加_id字段
    mongoose.model('Opus', opusSchema);
}

exports.setup = setup;
