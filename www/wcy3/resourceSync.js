/**
 * Created by Andrewz on 8/7.
 * Resource synchronizer: 在背景中运行， 把 用到的本地资源sync到服务器，
 * ** 在同步过程中， 显示“系统忙”标识，
 * ** 在同步成功之后， 更新element中的src，从本地url改为云资源url， 并且在RM中更改， 以便于播放， 复制。
 * ** 退出：如果sync任务没有完成，则提示它，
 * ** 保存：如果sync任务没有完成，则提示它， （把保存cmd，放到Queue中）
 * ** 如果没有完成， 下次启动之后，
 */

this.TQ = this.TQ || {};

this.TQ.ResourceSync = (function () {
    return {
        local2Cloud: local2Cloud
    };

    function local2Cloud(ele, fileOrBuffer, matType) {
        angular.element(document.body).injector().get('NetService').uploadOne(fileOrBuffer, matType)
            .then(function (res) {
                console.log(res.url);
                ele.jsonObj.src = res.url;
                TQ.MessageBox.hide();
            });
    }
})();
