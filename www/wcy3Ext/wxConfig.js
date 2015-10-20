angular.module('starter').
    factory('WxService', function ($rootScope, $timeout, $http, $q) {

    //微信配置
    var config = function () {
        var url = location.href.split('#')[0];
        var d = $q.defer();

        //默认分享url
        $http({
            method: 'GET',
            url: 'http://api.udoido.cn/wechat/sign?url=' + url,
            data: {}
        }).success(function (wechat_sign) {
            wx.ready(function (msg) {
                TQ.Log.info("Wx Ready! " + msg);
            });

            wx.error(function (error) {
                TQ.Log.error("Wx Error " + error);
            });

            wx.config({
                debug: true, // false,
                appId: wechat_sign.appId,
                timestamp: wechat_sign.timestamp,
                nonceStr: wechat_sign.nonceStr,
                signature: wechat_sign.signature,
                jsApiList: [
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
                ],
                success: _onSuccess,
                fail: _onFail,
                complete: _onComplete,
                cancel: _onCancel
            });

            wx.ready(function (msg) {
                TQ.Log.info("Wx Ready! " + msg);
            });

            wx.error(function (error) {
                TQ.Log.error("Wx Error " + error);
            });

            wx.checkJsApi({
                jsApiList: [
                    'getNetworkType',
                    'onMenuShareTimeline',
                    'onMenuShareAppMessage'
                ],
                success: function (res) {
                    TQ.Log.info("wx is supported!");
                    d.resolve(res);
                }
            });
        });

        return d.promise
    };

    var desc = "desccc",
        title = " title",
        link = "http://bone.udoido.cn",
        imgUrl = "http://bone.udoido.cn/mcImages/p10324.png",
        imgData = imgUrl;

    function shareMessage() {
        wx.onMenuShareAppMessage({
            desc: desc,
            title: title,
            link: link,
            imgUrl: imgUrl,
            success: _onSuccess,
            fail: _onFail,
            complete: _onComplete,
            cancel: _onCancel});
        wx.onMenuShareTimeline({
            title: title,
            link: link,
            imgUrl: imgUrl,
            success: _onSuccess,
            fail: _onFail,
            complete: _onComplete,
            cancel: _onCancel});
    }

/*    wx.share({
        title: title,
        description: desc,
        url: link,
        thumbData: imgData
    });
*/


    // private function:
    function _onSuccess(data) {
        TQ.Log.info("success：接口调用成功时执行的回调函数。");
        TQ.Log.info(data.errMsg);
    }

    function _onFail(data) {
        TQ.Log.info("fail：接口调用失败时执行的回调函数。");
        TQ.Log.info(data.errMsg);

        /*
        以上几个函数都带有一个参数，类型为对象，其中除了每个接口本身返回的数据之外，还有一个通用属性errMsg，其值格式如下：
        调用成功时："xxx:ok" ，其中xxx为调用的接口名
        用户取消时："xxx:cancel"，其中xxx为调用的接口名
        调用失败时：其值为具体错误信息
        */

        /*
         备注：不要尝试在trigger中使用ajax异步请求修改本次分享的内容，因为客户端分享操作是一个同步操作，这时候使用ajax的回包会还没有返回。
         */
    }

    function _onComplete(data) {
        TQ.Log.info("complete：接口调用完成时执行的回调函数，无论成功或失败都会执行。");
        TQ.Log.info(data.errMsg);
    }
    function _onCancel(data) {
        TQ.Log.info("cancel：用户点击取消时的回调函数，仅部分有用户取消操作的api才会用到。");
        TQ.Log.info(data.errMsg);
    }
    function _onTrigger(data) {
        TQ.Log.info("trigger: 监听Menu中的按钮点击时触发的方法，该方法仅支持Menu中的相关接口。");
        TQ.Log.info(data.errMsg);
    }

    return {
        config: config,
        shareMessage: shareMessage
    };
});
