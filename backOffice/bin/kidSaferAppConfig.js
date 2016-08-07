/**
 * Created by Andrewz on 8/2/2016.
 */
var appConfig = {
    useVHost: true,
    wwwRoot: './../../www',
    routesMap: [{url: 'index55', filePath: './../routes/index33'}
        // {url: 'users', filePath: './../routes/users'},
        // {url: 'material', filePath: './../routes/material'}
    ]
};

exports.wwwRoot = appConfig.wwwRoot;
exports.useVHost = appConfig.useVHost;
exports.routesMap = appConfig.routesMap;
