/**
 * Created by admin on 12/1/2015.
 */
// getting-started.js
var mongoose = require('mongoose');
var assert = require('assert');
//var url = 'mongodb://localhost:27017/test'; //XX, 在断网的情况下,不能使用
var url = 'mongodb://127.0.0.1/test'; //  本机ip，在断网的情况下也可以使用
var Users;
var autoIncrement = require('mongoose-auto-increment');

var ObjectId = require('mongodb').ObjectID;
//数据库操作类
function DBMain() {

}

DBMain.initialized = false;
DBMain.app = null;
function init(app) {
    if (DBMain.initialized) {
        assert.ok(false, "需要先initialization！");
        return;
    }

    var db = mongoose.connection;
    db.on('error', onError);
    db.once('error', onError);
    db.once('open', function (callback) {
        DBMain.initialized = true;
        console.log("Connected correctly to server.");
    });

    var connection = mongoose.connect(url);
    autoIncrement.initialize(connection);

    var dbList = [
        {name:'Show', schema:'../db/show/showSchema.js', ctrl:'../db/show/showController.js'},
        {name:'Share', schema:'../db/share/shareSchema.js', ctrl:'../db/share/shareController.js'},
        {name:'User', schema:'../db/user/userSchema.js', ctrl:'../db/user/userController.js'},
        {name:'Opus', schema:'../db/opus/opusSchema.js', ctrl:'../db/opus/opusController.js'},
        {name:'PictureMat', schema:'../db/material/pictureMatSchema.js', ctrl:'../db/material/pictureMatController.js'},
        {name:'AudioMat', schema:'../db/material/audioMatSchema.js', ctrl:'../db/material/audioMatController.js'}
    ];

    var i;
    var dbAmount = dbList.length;
    var item, ctrl;
    for (i = 0; i < dbAmount; i++) {
        item = dbList[i];
        // 绑定Schema
        require(item.schema).setup(autoIncrement); // 注意文件名带 。js

        // 链接数据库读写组件
        ctrl = require(item.ctrl);

        //设置数据库的路由
        app.use('/' + item.name, ctrl.add);
    }
    console.log("DB Router start...");
}

DBMain.stop = function() {
    if (!DBMain.initialized) {
        console.log("cmd to start db: ");
        console.log('mongod -dbpath D:\\Tools\\dbMongo\\db');
        assert.ok(false, "错误：没有initialization,  需要先 Start DB, first!");
        return;
    }
    mongoose.disconnect();
    console.log("DB disconnected correctly!");
};

var insertDocument = function (db, callback) {
    var newUser = new Users({
        name: 'andrew' + (new Date()).getTime(),
        score: 100
    });

    newUser.save(showDocument);
};

function showDocument(err, doc) {
    console.log("result: " + err);
    console.log("saved doc is: ", doc);
}

var findUser = function() {
    var query = Users.findOne().where('score', 100);
    query.exec(showDocument);
};

var updateRestaurants = function (db, callback) {
};

// private functions:
function onError(e) {
    console.error('connection error: check your network!' + JSON.stringify(e));
}

DBMain.testAdd = insertDocument;
DBMain.testSearch = findUser;
DBMain.init = init;
module.exports = DBMain;
