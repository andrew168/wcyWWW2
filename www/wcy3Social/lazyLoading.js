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
        if (s === 'link') {
            document.getElementsByTagName('head')[0].appendChild(js);
        } else {
            fjs.parentNode.insertBefore(js, fjs);
        }

        js.onload = onLoaded;
        if (s === 'link') {
            js.href = src;
            js.rel = 'stylesheet';
            js.type = 'text/css';
        } else {
            js.src = src;
        }
    }

    function start() {
        if (TQ.Config.hasFacebook) {
            TQ.LazyLoading.loadOne("/wcy3Social/fb.js");
        }
    }
})();
