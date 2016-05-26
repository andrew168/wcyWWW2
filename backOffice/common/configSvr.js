/**
 * Created by Andrewz on 5/14/2016.
 */
/**
 * Created by admin on 12/5/2015.
 */

var configSvr = {
    wx: {
        bindToken: "tuqiangkeji1111"
    },

    // dbServer: 'mongodb://localhost:27017/test', //XX, 在断网的情况下,不能使用
    // dbServer: 'mongodb://127.0.0.1/test' //  本机ip，在断网的情况下也可以使用
    dbServer: 'mongodb://cyly.udoido.cn/test' //  使用统一的udoido.cn的数据库
};

exports.wx = configSvr.wx;
exports.dbServer = configSvr.dbServer;
