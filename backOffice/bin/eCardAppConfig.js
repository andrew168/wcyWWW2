/**
 * Created by Andrewz on 8/4/2016.
 */
var appConfig = {
    useVHost: true,
    wwwRoot: './../../www',
    routesMap: [
        {url: 'index55', filePath: './../routes/index33'},
        // {url: 'users', filePath: './../routes/users'},
        {url: 'getCSignature', filePath: './../routes/getCSignature'},
        {url: 'getWSignature', filePath: './../routes/getWSignature'},
        {url: 'isWx', filePath: './../routes/isWx'},
        {url: 'wechat', filePath: './../routes/isWx'}, //???
        {url: 'wcy', filePath: './../routes/wcy'},
        {url: 'wcyList', filePath: './../routes/wcyList'},
        {url: 'material', filePath: './../routes/material'}
    ]
};

exports.wwwRoot = appConfig.wwwRoot;
exports.useVHost = appConfig.useVHost;
exports.routesMap = appConfig.routesMap;
