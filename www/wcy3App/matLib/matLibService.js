/**
 * Created by Andrewz on 7/10/2016.
 */

angular.module('starter').factory("MatLibService", MatLibService);
MatLibService.$inject = ['$http'];

function MatLibService($http) {
    var buffer = [];

    return {
        getProps: getProps
    };

    function getProps(keyword) {
        if (!buffer[keyword]) {
            buffer[keyword] = new TQ.DataObject();
            search(keyword);
        }
        var pageStep = 0;
        return buffer[keyword].getPage(pageStep);
    }

    function search(keyword) {
        $http({
            method: 'GET',
            url: 'https://openclipart.org//search/json/?query=' + keyword + '&amount=20&page=0&sort=downloads'
        }).then(onReceived);

        function onReceived(pkg){
            var list = [];

            if ((pkg.status === 200) &&
                (pkg.data.msg === "success") &&
                (pkg.data.info.results > 0) &&
                (pkg.data.payload)) {
                pkg.data.payload.forEach(convert);
                buffer[keyword].setList(list);
            }

            function convert(item) {
                list.push({
                    isProxy: true,
                    tags: item.tags,
                    thumbPath: item.svg.png_thumb,
                    path: item.svg.png_full_lossy
                });
            }
        }
    }
}
