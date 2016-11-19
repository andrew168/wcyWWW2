/**
 * Created by Andrewz on 7/12/2016.
 */

TQ.LazyLoading = (function(){
    return {
        loadOne: loadOne,
        start: start
    };

    function loadOne(src, onLoaded) {
        var d = document,
            s = (src.indexOf(".css") < 0) ? 'script' : 'link',
            id = src.replace(/\W/g, '_');
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {
            return;
        }
        js = d.createElement(s);
        js.id = id;
        js.onloaded = onLoaded;
        if (s === 'link') {
            js.href = src;
            js.rel = 'stylesheet';
            js.type = 'text/css';
            document.getElementsByTagName('head')[0].appendChild(js);
        } else {
            js.src = src;
            fjs.parentNode.insertBefore(js, fjs);
        }
    }

    function start() {
        TQ.LazyLoading.loadOne("/wcy3Social/fb.js");
    }
})();
