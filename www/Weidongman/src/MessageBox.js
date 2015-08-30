/**
 * Tuqiang Game Engine
 * Copy right Tuqiang Tech
 * Created at : 12-11-12 下午4:38
 */

window.TQ = window.TQ || {};
(function () {

    function MessageBox(canvas) {
        this.messageField = new createjs.Text("", "bold 24px Arial", "#FF0000");
        this.messageField.maxWidth = 1000;
        this.messageField.textAlign = "center";
        this.messageField.x = canvas.width / 3;
        this.messageField.y = canvas.height / 3;
        this.messageField.visible = false;
        stage.addChild(this.messageField);
        // messageField.text = "开始载入。。。";
    }

    MessageBox.prototype.show = function(str) {
        if (!stage.contains(this.messageField)) {
            stage.addChild(this.messageField);
        }

        this.messageField.text = str;
        if (!this.messageField.visible) {
            this.messageField.visible = true;
        }
    };

    MessageBox.prototype.hide = function() {
        this.messageField.visible = false;
    };

    TQ.MessageBox = MessageBox;
} ());