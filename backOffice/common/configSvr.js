/**
 * Created by Andrewz on 5/14/2016.
 */
// 这是各个App共用的config
var configSvr = {
    wx: {
        bindToken: "tuqiangkeji1111",
        udoido: {
            appID: 'wx5fe65e70536d0258',
            appSecret: '393e38d14682d6e2ee524dbc96b080bf'
        }
    },


// dbServer: 'mongodb://webreaderw!981:savety#$7619@localhost:57098/test', //XX, 在断网的情况下,不能使用
    dbServer: 'mongodb://webreaderw!981:savety#$7619@127.0.0.1:57098/test' //  本机ip，在断网的情况下也可以使用
    // dbServer: 'mongodb://webreaderw!981:savety#$7619@show.udoido.cn:57098/test' //  使用统一的udoido.cn的数据库
};


exports.wx = configSvr.wx;
exports.dbServer = configSvr.dbServer;
