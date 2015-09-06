angular.module('starter.services', [])
    .factory("GetWcy", function($http, $localStorage) {
        function test() {
            // var filename = "p12853.wdm";
            // var filename = "p12585.wdm"; // Bear
            // var filename = "p14959.wdm"; // straw berry
            var filename = "p14961.wdm"; // 比例变换测试
            var content = null;
            var url = 'http://bone.udoido.cn/wcy/wdmOpen?filename=' + filename;
            content = $localStorage.testScene;
            if (!content) {
                $http.get(url, {})
                    .success(function (data, status, headers, config) {
                        console.log(data);
                        content = $localStorage.testScene = JSON.stringify(data);
                        var fileInfo = {name: filename, content: content};
                        showWcy(fileInfo);
                    }).error(function (data, status, headers, config) {
                        console.log(data);
                    });
            } else {
                var fileInfo = {name: filename, content: content};
                showWcy(fileInfo);
            }
        }

        function showWcy(fileinfo) {
            $("#Container").css("width", TQ.Config.validPageWidth.toString() + "px");
            // setStageSize(600, 480);
            TQ.WCY.isPlayOnly = true;
            initCreateEnvironment(TQ.WCY.isPlayOnly);
            TQ.SceneEditor.showWcy(fileinfo);
            TQ.floatToolbar.initialize();
            TQ.floatToolbar.isVisible();
        }

        function testCreateScene() {
            TQ.SceneEditor.createScene();
        }

        return {
            test: test,
            testCreateScene: testCreateScene,
            showWcy: showWcy
        };
    })

.factory('Chats', function() {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var chats = [{
    id: 0,
    name: 'Ben Sparrow',
    lastText: 'You on your way?',
    face: 'https://pbs.twimg.com/profile_images/514549811765211136/9SgAuHeY.png'
  }, {
    id: 1,
    name: 'Max Lynx',
    lastText: 'Hey, it\'s me',
    face: 'https://avatars3.githubusercontent.com/u/11214?v=3&s=460'
  }, {
    id: 2,
    name: 'Adam Bradleyson',
    lastText: 'I should buy a boat',
    face: 'https://pbs.twimg.com/profile_images/479090794058379264/84TKj_qa.jpeg'
  }, {
    id: 3,
    name: 'Perry Governor',
    lastText: 'Look at my mukluks!',
    face: 'https://pbs.twimg.com/profile_images/598205061232103424/3j5HUXMY.png'
  }, {
    id: 4,
    name: 'Mike Harrington',
    lastText: 'This is wicked good ice cream.',
    face: 'https://pbs.twimg.com/profile_images/578237281384841216/R3ae1n61.png'
  }];

  return {
    all: function() {
      return chats;
    },
    remove: function(chat) {
      chats.splice(chats.indexOf(chat), 1);
    },
    get: function(chatId) {
      for (var i = 0; i < chats.length; i++) {
        if (chats[i].id === parseInt(chatId)) {
          return chats[i];
        }
      }
      return null;
    }
  };
});
