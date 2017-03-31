/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 动画轨迹， 只是数据， 没有操作. 操作完全来自 AnimeController
 */
TQ = TQ || {};

(function () {
    function AnimeTrack (desc) {
        this.initialize(desc);
    }
    var p = AnimeTrack.prototype;
    p.erase = function(track) {
        if (this.x) this.x.erase();
        if (this.y) this.y.erase();
        if (this.rotation) this.rotation.erase();
        if (this.sx) this.sx.erase();
        if (this.sy) this.sy.erase();
        if (this.visible) this.visible.erase();
    };

    p.initialize = function(desc)
    {
        assertNotNull(TQ.Dictionary.FoundNull, desc); // 应该在element已经验证了, 补全了
        assertNotNull(TQ.Dictionary.FoundNull, desc.x);
        assertNotNull(TQ.Dictionary.FoundNull, desc.y);
        assertNotNull(TQ.Dictionary.FoundNull, desc.rotation);
        assertNotNull(TQ.Dictionary.FoundNull, desc.sx);
        assertNotNull(TQ.Dictionary.FoundNull, desc.sy);
        if (!desc.animeTrack || !desc.animeTrack.x) {
            this.x = new TQ.OneTrack(desc.x);
        } else {
            this.x = new TQ.OneTrack(desc.animeTrack.x);
        }

        if (!desc.animeTrack || !desc.animeTrack.y) {
            this.y = new TQ.OneTrack(desc.y);
        } else {
            this.y = new TQ.OneTrack(desc.animeTrack.y);
        }

        if (!desc.animeTrack || !desc.animeTrack.rotation) {
            this.rotation = new TQ.OneTrack(desc.rotation);
        } else {
            this.rotation = new TQ.OneTrack(desc.animeTrack.rotation);
        }

        if (!desc.animeTrack || !desc.animeTrack.sx) {
            this.sx = new TQ.OneTrack(desc.sx);
        } else {
            this.sx = new TQ.OneTrack(desc.animeTrack.sx);
        }

        if (!desc.animeTrack || !desc.animeTrack.sy) {
            this.sy = new TQ.OneTrack(desc.sy);
        } else {
            this.sy = new TQ.OneTrack(desc.animeTrack.sy);
        }

        if (!desc.animeTrack || !desc.animeTrack.visible) { // 即时添加的元素
            this.visible = new TQ.OneTrack(desc.isVis ? 1 : 0, TQ.TrackDecoder.JUMP_INTERPOLATION);
            if (!TQ.FrameCounter.isAtBeginning()) {
                TQ.TrackRecorder.recordOneTrack(this.visible, 0.0, false, TQ.TrackDecoder.JUMP_INTERPOLATION);
            }
        } else { // 从文件中读入的元素
            this.visible = new TQ.OneTrack(desc.animeTrack.visible);
        }

        // action, 如果有，则建立它； 如果没有， 不补充；
        if ((desc.animeTrack) && (desc.animeTrack.action)) {
            this.action = new TQ.OneTrack(desc.animeTrack.action);
        }
    };

    AnimeTrack.validate = function(tracks) {
        AnimeTrack._validateOne(tracks.x);
        AnimeTrack._validateOne(tracks.y);
        AnimeTrack._validateOne(tracks.rotation);
        AnimeTrack._validateOne(tracks.sx);
        AnimeTrack._validateOne(tracks.sy);
        AnimeTrack._validateOne(tracks.visible);
    };

    AnimeTrack._validateOne = function(track) {
        track.tid1 = (track.tid1 == undefined) ? 0: track.tid1;
        track.tid2 = (track.tid2 == undefined) ? 0: track.tid2;
    };

    AnimeTrack.calculateLastFrame = function(track) {
        assertTrue(TQ.Dictionary.INVALID_LOGIC, !!track);
        var tMax = 0;
        tMax = Math.max(tMax, TQ.TrackDecoder.calculateLastFrame(track.x));
        tMax = Math.max(tMax, TQ.TrackDecoder.calculateLastFrame(track.y));
        tMax = Math.max(tMax, TQ.TrackDecoder.calculateLastFrame(track.sx));
        tMax = Math.max(tMax, TQ.TrackDecoder.calculateLastFrame(track.sy));
        tMax = Math.max(tMax, TQ.TrackDecoder.calculateLastFrame(track.rotation));
        tMax = Math.max(tMax, TQ.TrackDecoder.calculateLastFrame(track.visible));
        return tMax;
    };

    AnimeTrack.hideToNow = function(ele, t) {
        TQ.TrackRecorder.recordOneTrack(ele.animeTrack.visible, 0, false, TQ.TrackDecoder.JUMP_INTERPOLATION);
        TQ.TrackRecorder.recordOneTrack(ele.animeTrack.visible, t, true, TQ.TrackDecoder.JUMP_INTERPOLATION);
    };

    AnimeTrack.hide = function(ele, t) {
        TQ.TrackRecorder.recordOneTrack(ele.animeTrack.visible, 0, false, TQ.TrackDecoder.JUMP_INTERPOLATION);
        TQ.TrackRecorder.recordOneTrack(ele.animeTrack.visible, t, false, TQ.TrackDecoder.JUMP_INTERPOLATION);
    };

    AnimeTrack.unHide = function(ele, t) {
        TQ.TrackRecorder.recordOneTrack(ele.animeTrack.visible, 0, false, TQ.TrackDecoder.JUMP_INTERPOLATION);
        TQ.TrackRecorder.recordOneTrack(ele.animeTrack.visible, t, true, TQ.TrackDecoder.JUMP_INTERPOLATION);
    };

    AnimeTrack.setButton = function(ele, t) {
        var lifeTime = 3/20; // 3 frame;
        // var currentTime = TQ.FrameCounter.t();
        ele.animeTrack.visible.reset();
        AnimeTrack.hideToNow(ele, t);
        TQ.TrackRecorder.recordOneTrack(ele.animeTrack.visible, t + lifeTime, false, TQ.TrackDecoder.JUMP_INTERPOLATION);
    };

    TQ.AnimeTrack = AnimeTrack;
})();
