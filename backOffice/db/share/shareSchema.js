/**
 * Created by admin on 12/4/2015.
 */

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

// XX时间，XX用户-XX防伪码-分享了XX作品
var shareSchema = new Schema({
  timestamp:{type:Date, default: Date.now},
  userId:Schema.ObjectId,
  code:String,
  opusId:Schema.ObjectId,

  // 分享者的足印信息： 从from地址来， 带有这些参数paras
  from: String,
  paras: String,
  _id: Number,
}, { _id: false });

function setup(autoIncrement) {
  shareSchema.plugin(autoIncrement, {id: 'share_id', inc_field: '_id'});
  mongoose.model('Share', shareSchema);
}

exports.setup = setup;
