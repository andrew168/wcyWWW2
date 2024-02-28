/**
 * Created by Andrewz on 3/25/19.
 */
// 可以播放1个声音， 或者多个声音，由playlist指定
var TQ = TQ || {};
(function() {
  var MAX_SOUND_LENGTH = 120; // 缺省声音是最大120s
  var STATE = {
    UNLOADED: 1,
    PLAYING: 2,
    PAUSED: 3,
    ENDED: 4
  };

  function HowlerPlayer(url, sprite, spriteMap) {
    var self = this;
    var canPreload = !!HowlerGlobal.unlocked;

    this.state = STATE.UNLOADED;
    this.howlerID = -1;
    this.tryingToPlay = false;
    var config = {
      src: [TQ.RM.toFullPathFs(url)],
      html5: true, // Force to HTML5 so that the audio can stream in (best for large files).
      preload: canPreload,
      onplay: function() {
        self.state = STATE.PLAYING;
        self.tryingToPlay = false;
      },
      onload: function() {
        TQ.Log.info("loaded...");
      },
      onend: function() {
        TQ.Log.info("end...");
        self.state = STATE.ENDED;
      },
      onpause: function() {
        TQ.Log.info("pause...");
        self.state = STATE.PAUSED;
      },
      onstop: function() {
        TQ.Log.info("stop...");
        self.state = STATE.PAUSED;
      },
      onseek: function() {
        TQ.Log.info("seek...");
      }
    };
    if (sprite) {
      config.sprite = sprite;
      if (spriteMap) {
        this.spriteMap = spriteMap;
      }
    }

    this.howl = new Howl(config);
    var sound = self.howl;
    if (!canPreload) {
      sound.once("unlock", function() {
        sound.load();
      });
    }
  }

  HowlerPlayer.prototype = {
    play: function(spriteName) {
      var self = this;
      var sound = self.howl;
      if (self.tryingToPlay) {
        return;
      }

      if (!sound.playing()) { // 同时只有1个实例在播放，不能多个实例{
        if (self.howlerID < 0) {
          if ((sound.state() === "unloaded") && !TQUtility.isBlobUrl(sound._src[0])) {
            sound.once("load", function() {
              self.howlerID = sound.play(spriteName);
            });
            self.tryingToPlay = true;
          } else {
            self.howlerID = sound.play(spriteName); // 首次播放
          }
        } else {
          TQ.AssertExt(sound, "需要先建立audio对象");
          TQDebugger.Panel.logInfo("resume, " + sound._sounds.length);
          // Begin playing the sound.
          var newID = sound.play(spriteName || self.howlerID);
          if (newID !== self.howlerID) {
            if (newID > 0) {
              if (self.howlerID !== newID) {
                console.error("为什么不相等？");
                self.howlerID = newID;
              }
            } else {
              //  虽然曾经存在，但是已经当做垃圾回收了
              self.howlerID = sound.play(spriteName);
            }
          }
        }
      }
    },

    get duration() {
      var self = this;
      var sound = self.howl;
      TQ.AssertExt(sound, "需要先建立audio对象");

      if (!sound) {
        return 0;
      }

      return 1000 * ((sound.state() !== "loaded") ? MAX_SOUND_LENGTH : sound.duration());
    },

    get paused() {
      return (this.state === STATE.PAUSED);
    },

    /**
     * Pause the currently playing track.
     */
    pause: function() {
      var self = this;
      var sound = self.howl;
      TQ.AssertExt(sound, "需要先建立audio对象");

      if (sound) {
        sound.pause();
      }

      TQ.Log.info("pause...");
    },

    stop: function() {
      var self = this;
      var sound = self.howl;
      TQ.AssertExt(sound, "需要先建立audio对象");

      if (sound) {
        sound.stop();
      }

      TQ.Log.info("stopped...");
    },

    resume: function(t, spriteName) {
      var self = this;
      var sound = self.howl;
      TQ.AssertExt(sound, "需要先建立audio对象");
      TQDebugger.Panel.logInfo("resume, " + sound._sounds.length);
      if (sound._sounds.length > 1) {
        // sound.stop();
        // setTimeout(function() {sound.play();}, 100);
      }
      if (sound) {
        if (t > self.duration) {
          self.stop();
        } else {
          if (sound.playing()) {
            // sound.seek(t, self.howlerID);
          } else {
            // sound.once('play', function () {
            //   sound.seek(t, self.howlerID);
            // });
            self.play(spriteName || self.howlerID);
          }
        }
      }
    },

    /**
     * Set the volume and update the volume slider display.
     * @param  {Number} val Volume between 0 and 1.
     */
    volume: function(val) {
      var self = this;
      var sound = self.howl;
      TQ.AssertExt(sound, "需要先建立audio对象");
      sound.volume(val);
      TQ.Log.info("volume " + val);
    },

    seek: function(t) {
      var self = this;
      var sound = self.howl;
      TQ.AssertExt(sound, "需要先建立audio对象");

      // Convert the percent into a seek position.
      if (sound && sound.playing()) {
        sound.seek(t);
      }
    },

    setPosition: function(t) {
      this.seek(t);
    },

    /**
     * The step called within requestAnimationFrame to update the playback position.
     */
    step: function() {
      var self = this;
      var sound = self.howl;
      TQ.AssertExt(sound, "需要先建立audio对象");

      if (sound) {
        var seek = sound.seek() || 0;
      }
      TQ.Log.info(self.formatTime(Math.round(seek)));
    },

    isPlaying: function() {
      return (this.howl.playing());
    },

    hasCompleted: function() {
      return (this.state === STATE.ENDED);
    },
    /**
     * Format the time from seconds to M:SS.
     * @param  {Number} secs Seconds to format.
     * @return {String}      Formatted time.
     */
    formatTime: function(secs) {
      var minutes = Math.floor(secs / 60) || 0;
      var seconds = (secs - minutes * 60) || 0;

      return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
    }
  };

  TQ.HowlerPlayer = HowlerPlayer;
}());
