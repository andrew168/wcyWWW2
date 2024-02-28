/**
 * Created by Andrewz on 4/19/19.
 */
window.TQ = window.TQ || {};

(function() {
  TQ.Element.prototype.playNextSound = function() {
    var spriteMap = this.jsonObj.spriteMap;
    if (spriteMap && spriteMap.length > 0) {
      if (this.spriteID === undefined) {
        this.spriteID = 0;
      } else {
        this.spriteID++;
      }
      if (this.spriteID >= spriteMap.length) {
        this.spriteID = 0;
      }
      this.play(true, spriteMap[this.spriteID]);
    } else {
      this.play(true);
    }
    this.forEachChildren("playNextSound");
    console.log("play next sound");
  };
}());
