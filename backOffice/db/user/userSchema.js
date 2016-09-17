
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var userSchema = new Schema({
    name: {type:String, index:1, required: true, unique:true},
    score: Number // 实时统计并显示？
});

function setup(autoIncrement) {
    userSchema.plugin(autoIncrement.plugin, 'User');
    mongoose.model('User', userSchema);
    console.log("required Paths:" + userSchema.requiredPaths());
    // console.log("indexes:" + userSchema.indexes());
}

exports.setup = setup;
