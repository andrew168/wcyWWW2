var wait = require('gulp-wait');
var fs = require('fs');

async function delay1000() {
    setTimeout(function () {
        return Promise.resolve();
    }, 10000);
}

async function waitForFiles(filename) {
    console.log("waiting for ready: " + filename);
    do {
        if (fs.existsSync(filename)) {
            console.log("ready: " + filename);
            return Promise.resolve();
        }
        await wait(200);
    } while (1);
}


async function doOnceExist(source, callback) {
    console.log("try to minify: " + source);
    try {
        fs.accessSync(source);
        if (callback) {
            callback()
        }
    } catch (err) {
        console.log(source + " not ready, try one more");
        console.log(err);
        setTimeout(function () {
            doOnceExist(source, callback);
        }, 10000);
    }

    // ToDo:
    return Promise.resolve();
}

exports.delay1000 = delay1000;
exports.waitForFiles = waitForFiles;
exports.doOnceExist = doOnceExist;
