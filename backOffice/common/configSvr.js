/**
 * Created by Andrewz on 5/14/2016.
 */
// 这是各个App共用的config
var configSvr = {
    wx: {
        bindToken: "tuqiangkeji1111"
    },

    // dbServer: 'mongodb://localhost:27098/test', //XX, 在断网的情况下,不能使用
    dbServer: 'mongodb://127.0.0.1:27098/test' //  本机ip，在断网的情况下也可以使用
    // dbServer: 'mongodb://show.udoido.cn:27098/test' //  使用统一的udoido.cn的数据库
};


exports.wx = configSvr.wx;
exports.dbServer = configSvr.dbServer;
