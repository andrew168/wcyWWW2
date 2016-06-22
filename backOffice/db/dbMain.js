/**
 * Created by admin on 12/1/2015.
 */
// getting-started.js
var mongoose = require('mongoose'),//加载mongoose需要花很多时间，导致server启动的慢
    assert = require('assert'),
    configSvr = require('./../common/configSvr'),
    url = configSvr.dbServer,
    Users,
    logger = require('./../common/logger'),
    autoIncrement = require('mongoose-auto-increment');

    logger.config("udoido.log");

var ObjectId = require('mongodb').ObjectID;
//数据库操作类
function DBMain() {

}

DBMain.initialized = false;
DBMain.app = null;
var launchCounter = 0;
function init(app, callback) {
    // must delay, because data base is not ready
    setTimeout(function() {
        doInit(app, callback);
    }, 0);
}

function doInit(app, callback) {
    var connection;
    if (DBMain.initialized) {
        assert.ok(false, "需要先initialization！");
        return;
    }

    function onErrorExt(err) {
        onError(err);
        if (err && err.state && (err.state=== 1 || err.state === 2)) {
            if (mongoose.connection) {
                mongoose.connection.close();
                console.log("try connect after close");
                setTimeout(function() {
                    tryToConnect();
                }, 200);
            }
        }

        if (err && err.name && err.name=== "MongoError") {
            if (err.message === "connect ECONNREFUSED"){
                if (launchCounter < 300) {
                    launchCounter ++;
                    setTimeout(function() {
                        tryToConnect();
                    }, 2000);
                }
            }
        }
    }

    var db = mongoose.connection;
    db.on('error', onErrorExt);
    db.once('open', function (msg) {
        DBMain.initialized = true;
        console.log("Database is opened successfully.");
        if (msg) {
            console.log(JSON.stringify(msg));
        }

        onConnected();
        if (!!callback) {
            callback();
        }
    });

    function onConnected() {
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

        autoIncrement.initialize(connection);
        for (i = 0; i < dbAmount; i++) {
            item = dbList[i];
            // 绑定Schema
            require(item.schema).setup(autoIncrement); // 注意文件名带 。js
            console.info("setup schema:  " + item.schema);

            // 链接数据库读写组件
            ctrl = require(item.ctrl);

            //设置数据库的路由
            app.use('/' + item.name, ctrl.add);
        }
        console.log("DB Router start...");
    }

    function tryToConnect() {
        console.log(launchCounter + "time launch....");
        var options = {
            db: {bufferMaxEntries: 0}
        };

        connection = mongoose.connect(url + "?autoReconnect=false", options, function (err) {
            if (!err) {
                console.log("no error");
            } else {
                onErrorExt(err);
            }
        });
    }

    tryToConnect();
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
    if (!e) {
        console.error("e is not defined in onError");
    } else {
        console.error('connection error, please 1) start db 2) connect to network!' + JSON.stringify(e));
    }
}

DBMain.testAdd = insertDocument;
DBMain.testSearch = findUser;
DBMain.init = init;
module.exports = DBMain;
