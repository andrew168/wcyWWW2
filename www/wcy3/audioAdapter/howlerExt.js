/**
 * Created by Andrewz on 3/29/19.
 */
(function () {
  var blankSound = new Howl({
    src: [""],
    html5: true, // Force to HTML5 so that the audio can stream in (best for large files).
    preload: false
  });
  blankSound.once('unlock', function () {
    HowlerGlobal.unlocked = true;
  });
}());
