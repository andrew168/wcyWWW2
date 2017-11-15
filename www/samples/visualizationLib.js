/**
 * Created by andrewz on 11/15/2017.
 */

var Aux = Aux || {};
Aux.Visualization = (function(){
    var dataModel = null,
        onCompleted = null;

    return {
        initialize : initialize,
        replay: replay,
        start: start
    };

    function initialize() {
        TQ.SceneEditor.createScene({});
    }

    function start(data, callback) {
        onCompleted = callback;
        dataModel = data;
        play(dataModel);
    }

    function play() {
        setTimeout(done, 1000);
    }

    function replay() {
        play(dataModel);
    }

    function done() {
        onCompleted();
        alert("completed, will send event");
    }
}());
