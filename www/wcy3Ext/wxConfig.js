angular.module('starter').
    factory('WxService', function ($http, $cookies, $q) {
        // ToDo: CORS 无法读取server设置的cookie，
        //     ==> Auth用户统计， 必须和网页一个host
        //  ==> sever的cookie可以是 http读取only， 不让客户端读写它，以便于追踪
        var user = userProfile.user;
        var _isReady = false;

        //在本应用中用到的API，（白名单）
        // 1) 白名单之外的API， 将无法使用
        // 2) 要检查、确认用户的环境支持这些API，否则，无法使用，
        var ApiList = [
            'checkJsApi',
            'onMenuShareTimeline',
            'onMenuShareAppMessage',
            'onMenuShareQQ',
            'onMenuShareWeibo',
            'hideMenuItems',
            'showMenuItems',
            'hideAllNonBaseMenuItem',
            'showAllNonBaseMenuItem',
            'translateVoice',
            'startRecord',
            'stopRecord',
            'onRecordEnd',
            'playVoice',
            'pauseVoice',
            'stopVoice',
            'uploadVoice',
            'downloadVoice',
            'chooseImage',
            'previewImage',
            'uploadImage',
            'downloadImage',
            'getNetworkType',
            'openLocation',
            'getLocation',
            'hideOptionMenu',
            'showOptionMenu',
            'closeWindow',
            'scanQRCode',
            'chooseWXPay',
            'openProductSpecificView',
            'addCard',
            'chooseCard',
            'openCard'
        ];

        var title = "春节快乐！",
            desc = "阖家欢乐，财源滚滚！",
            link = TQ.Config.ENT_HOST,
            imgUrl = TQ.Config.MAT_HOST + "/mcImages/p10324.png",
            // imgUrl = TQ.Config.MAT_HOST + "/mcImages/animation1.gif",
            imgData = imgUrl;


        //微信配置
        var getSignature = function () {
            $http({
                method: 'GET',
                url:TQ.Config.AUTH_HOST + '/getWSignature?filename=myfile',
                data: {}
            }).success(doConfig);
        };

        wx.ready(function (msg) {
            // TQ.Log.alertInfo("Wx Ready! " + JSON.stringify(msg));
            // 对于注册型的API，在此调用
            // checkAPI();
            shareMessage(); // 其实，只是预制内容而已， 并非直接发送，
                            // 只有等客户点击“分享给朋友”按钮之后，这些内容才会自动填入
            _isReady = true;
        });

        wx.error(function (error) {
            TQ.Log.alertError("Wx Error " + JSON.stringify(error));
        });

        function doConfig (wechat_sign) {
            /* 1） 需要使用JS-SDK的页面必须先注入配置信息, 否则将无法调用
             2） 同一个url仅需调用一次，
             3） 对于变化url的SPA的web app可在每次url变化时进行调用,
             4） 目前Android微信客户端不支持pushState的H5新特性，
             所以使用pushState来实现web app的页面会导致签名失败，
             此问题会在Android6.2中修复）

             ？？ 2小时之后， 是否需要重新认证？

             */
            user.timesShared = $cookies.get('timesCalled');
            user.ID = $cookies.get('userID');

            //TQ.Log.alertInfo(JSON.stringify(wechat_sign));
            var appId = 'wx9a9eb662dd97612f';
            wx.config({
                debug: true, // false,
                appId: appId,
                timestamp: wechat_sign.timestamp,
                nonceStr: wechat_sign.nonceStr,
                signature: wechat_sign.signature,
                jsApiList: ApiList,
                success: _onSuccess,
                fail: _onFail,
                complete: _onComplete,
                cancel: _onCancel
            });
        }

        function checkAPI() {
            wx.checkJsApi({
                jsApiList: ApiList,
                success: function (res) {
                    TQ.Log.alertInfo("All is supported!");
                },
                fail: function(res) {
                    TQ.Log.alertInfo("不支持"+JSON.stringify(res));
                },
                complete: _onComplete,
                cancel: _onCancel
            });
        }


        function shareMessage() {
            user.timesShared = $cookies.get('timesCalled');
            user.ID = $cookies.get('userID');
            wx.onMenuShareAppMessage({
                desc: desc,
                title: title,
                link: link + "?user=" + user.ID + "&timesCalled=" + user.timesShared,
                imgUrl: imgUrl,
                trigger:_onTrigger,
                success: _onSuccess,
                fail: _onFail,
                complete: _onComplete,
                cancel: _onCancel});
        }

        // private function:
        function _onSuccess(data) {
            TQ.Log.alertInfo("onSuccess：成功。" + data.errMsg + "\nData: \n" + JSON.stringify(data));
        }

        function _onFail(data) {
            TQ.Log.alertInfo("onFail：失败。" + data.errMsg + "\nData \n" + JSON.stringify(data));

            /*
             以上几个函数都带有一个参数，类型为对象，其中除了每个接口本身返回的数据之外，还有一个通用属性errMsg，其值格式如下：
             调用成功时："xxx:ok" ，其中xxx为调用的接口名
             用户取消时："xxx:cancel"，其中xxx为调用的接口名
             调用失败时：其值为具体错误信息
             */
        }

        function _onComplete(data) {
            TQ.Log.alertInfo("onComplete：无论成功与否");
            TQ.Log.alertInfo(data.errMsg);
            TQ.Log.alertInfo(JSON.stringify(data));
        }
        function _onCancel(data) {
            TQ.Log.alertInfo("_onCancel：。" + data.errMsg + "\n Data:" + JSON.stringify(data));
        }
        function _onTrigger(data) {
            TQ.Log.alertInfo("trigger: XX 菜单按钮被触发" + data.errMsg + "\n Data: " + JSON.stringify(data));
            /*
             备注：不要尝试在trigger中使用ajax异步请求修改本次分享的内容，因为客户端分享操作是一个同步操作，这时候使用ajax的回包会还没有返回。
             */
        }

        function chooseImage() {
            var q = $q.defer();

            wx.chooseImage({
                count: 2, // 默认9
                sizeType: ['original', 'compressed'],
                sourceType: ['album', 'camera'],
                success11: function (res) {
                   var localIds = res.localIds; // 返回选定照片的本地ID列表，localId可以作为img标签的src属性显示图片
                   TQ.Log.alertInfo('已选择 ' + localIds + ' 张图片');
                   TQ.Log.alertInfo('已选择 ' + 222 + ' 张图片');
                },

                success : function (res) {
                    var localId = res.localIds[0];
                    TQ.Log.alertInfo('已选择 ' + res.localIds.length + ' 张图片');
                    q.resolve(localId);
                }
            });

            return q.promise;
        }

        function isReady() {
            return _isReady;
        }

        function init() {
            return getSignature();
        }

        return {
            init: init,
            config: getSignature,
            shareMessage: shareMessage,
            checkAPI: checkAPI,
            chooseImage: chooseImage,
            isReady: isReady
        };
    });
