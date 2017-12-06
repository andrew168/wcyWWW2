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
function init(app, appConfig, callback) {
    // must delay, because data base is not ready
    setTimeout(function() {
        doInit(app, appConfig, callback);
    }, 0);
}

function doInit(app, appConfig, callback) {
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
                }, 3000);
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

        onConnected(appConfig);
        if (!!callback) {
            callback();
        }
    });

    function onConnected(appConfig) {
        var dbList = appConfig.dbList;

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
            // app.use('/' + item.name, ctrl.add);
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
                console.log("db started successfully!");
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
        console.error('数据库连接出错：1) 启动数据库 2) 检查网络连接!' + JSON.stringify(e));
    }
}

DBMain.testSearch = findUser;
DBMain.init = init;
module.exports = DBMain;
