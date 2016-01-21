/**
 * Created by Andrewz on 1/21/2016.
 */

function onResSave(err, doc, res) {
    showDocument(err, doc);
    if (!err) {
        res.json(doc);
    } else {
        notFound(res);
    }
}

function onSave(err, doc, onSuccess, onError) {
    showDocument(err, doc);
    if (!err) {
        onSuccess(doc._id);
    } else {
        onError(err);
    }
}

function notFound(res, data) {
    res.json(404, {msg: 'not found ' + data});
}

function showDocument(err, doc) {
    console.log("result: " + err);
    console.log("saved doc is: ", doc);
}

module.exports.notFound = notFound;
module.exports.dumpDocument = showDocument;
module.exports.onSave = onSave;
module.exports.onResSave = onResSave;
