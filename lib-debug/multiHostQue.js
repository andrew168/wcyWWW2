/**
 * Created by Andrewz on 2/15/18.
 */
var TQ = TQ || {};
TQ.MultiHostQue = (function(){
    var maxConnectionPerHost = 6,
        maxConnections = 20,
        hosts = [],
        urls = [];

    return {
        addUrl: addUrl,
        close: close,
        isHostFull: isHostFull,
        removeUrl: removeUrl
    };

    function addUrl(url) {
        var host = TQ.Base.Utility.urlParser(url).host;
        if (hosts.indexOf(host) < 0) {
            urls[host] = [];
            hosts.push(host);
        }
        urls[host].push(url);
    }

    function removeUrl(url) {
        var host = TQ.Base.Utility.urlParser(url).host;
        if (hosts.indexOf(host) < 0) {
            return;
        }
        var id = urls[host].indexOf(url);
        if (id >= 0) {
            urls[host].splice(id, 1);
        }
    }

    function close() {
        hosts.forEach(function(host) {
            urls[host].splice(0);
        })
    }
    function isHostFull(url) {
        var host = TQ.Base.Utility.urlParser(url).host;
        return ((hosts.indexOf(host) > 0) && (urls[host].length > maxConnectionPerHost));
    }
}());
