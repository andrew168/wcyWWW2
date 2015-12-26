/**
 * Created by admin on 12/1/2015.
 * 在 /File/Settings/editor/File Encodings中, 把下面3处都设置为 UTF-8
 IDE encoding
 Project Encoding
 Default encoding for properties files:

 */
var mongoose = require('mongoose');
var assert = require('assert');
var url = 'mongodb://localhost:27017/test';
var userSchema;
var Users;

var ObjectId = require('mongodb').ObjectID;
// 数据库操作
function DBMain() {

}

DBMain.initialized = false;
DBMain.init = function() {
    if (DBMain.initialized) {
        assert.ok(false, "�ظ�initialization��");
        return;
    }

    var db = mongoose.connection;
    db.on('error', onError);
    db.once('error', onError);
    db.once('open', function (callback) {
        DBMain.initialized = true;
        userSchema = require('user/user-schema.js');
        Users = mongoose.model('testdb1', userSchema);
        console.log("Connected correctly to server.");
    });
    mongoose.connect(url);
};

DBMain.stop = function() {
    if (!DBMain.initialized) {
        console.log("cmd to start db: ");
        console.log('mongod -dbpath D:\\Tools\\dbMongo\\db');
        assert.ok(false, "��δinitialization��,   Start DB, first!");
        return;
    }
    mongoose.disconnect();
    console.log("DB disconnected correctly!");
};

// ����
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
    console.error('connection error222: check your network!' + JSON.stringify(e));
}

DBMain.testAdd = insertDocument;
DBMain.testSearch = findUser;
module.exports = DBMain;