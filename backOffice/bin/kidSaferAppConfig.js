/**
 * Created by Andrewz on 8/2/2016.
 */
var appConfig = {
  name:"kidSafer",
  useVHost: true,
  wwwRoot: './../../wwwks',
  dbList: [ // 他们在dbMain.js中使用， 所以要以dbMain.js的目录为相对路径
    {name: 'Kid', schema: '../db/kid/kidSchema.js', ctrl: '../db/kid/kidController.js'},
    {name: 'Show', schema: '../db/show/showSchema.js', ctrl: '../db/show/showController.js'},
    {name: 'Share', schema: '../db/share/shareSchema.js', ctrl: '../db/share/shareController.js'},
    {name: 'User', schema: '../db/user/userSchema.js', ctrl: '../db/user/userController.js'},
    {name: 'Opus', schema: '../db/opus/opusSchema.js', ctrl: '../db/opus/opusController.js'},
    {name: 'PictureMat', schema: '../db/material/pictureMatSchema.js', ctrl: '../db/material/pictureMatController.js'},
    {name: 'AudioMat', schema: '../db/material/audioMatSchema.js', ctrl: '../db/material/audioMatController.js'}
  ],
  routesMap: [// {url: 'index55', filePath: './../routes/index33'},
    // {url: 'users', filePath: './../routes/users'},
    {url: 'user', filePath: './../routes/user'},
    {url: 'kid', filePath: './../routes/kid'}
  ]
};

exports.dbList = appConfig.dbList;
exports.name = appConfig.name;
exports.routesMap = appConfig.routesMap;
exports.useVHost = appConfig.useVHost;
exports.wwwRoot = appConfig.wwwRoot;
