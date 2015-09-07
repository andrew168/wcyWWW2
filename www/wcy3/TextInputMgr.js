/**
 * Created by admin on 9/7/2015.
 * TextInputAdapter is an adapter of CanvasInput.js in lib
 */

window.TQ = window.TQ || {};
(function () {
    function TextInputMgr() {

    }

    var option = {
        canvas:  document.getElementById('testCanvas1122'),
        fontSize: 38,
        fontFamily: 'Arial',
        fontColor: '#212121',
        fontWeight: 'bold',  // normal
        fontStyle: 'italic',  // normal
        x: 200,
        y: 200,
        width: 300,
        padding: 8,

        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 3,
        boxShadow: '1px 1px 0px #fff',
        innerShadow: '0px 0px 5px rgba(0, 0, 0, 0.5)',
        placeHolder: 'Enter message here...'
    };

    TextInputMgr.start = function() {
        var input = new CanvasInput(option);
    };

    TQ.TextInputMgr = TextInputMgr;
})();
