/**
 * Created by Andrewz on 7/10/2016.
 */

angular.module('starter').factory("MatLibService", MatLibService);
MatLibService.$inject = ['$http'];

function MatLibService($http) {
    var result = new TQ.DataObject();

    return {
        getProps: getProps,
        search: search
    };

    function getProps(pageStep) {
        return result.getPage(pageStep);
    }

    function search(keyword) {
        $http({
            method: 'GET',
            url: 'https://openclipart.org//search/json/?query=' + keyword + '&amount=20&page=0&sort=downloads'
        }).then(onReceived);
    }

    function onReceived(pkg) {
        var list = [];

        if ((pkg.status === 200) &&
            (pkg.data.msg === "success") &&
            (pkg.data.info.results > 0) &&
            (pkg.data.payload)) {
            pkg.data.payload.forEach(convert);
            result.setList(list);
        }

        function convert(item) {
            list.push({isProxy:true, tags: item.tags, thumbPath: item.svg.png_thumb, path:item.svg.png_full_lossy});
        }
    }
}
