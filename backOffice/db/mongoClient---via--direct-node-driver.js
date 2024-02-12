/**
 * Created by admin on 12/1/2015.
 */
var MongoClient = require("mongodb").MongoClient;
var assert = require("assert");
var url = "mongodb://localhost:27017/test";
var ObjectId = require("mongodb").ObjectID;
// 打开和关闭
function DBMain() {

}

DBMain.initialized = false;
DBMain.init = function() {
  if (DBMain.initialized) {
    assert.ok(false, "重复initialization！");
    return;
  }

  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    if (!err) {
      DBMain.initialized = true;
    }
    console.log("Connected correctly to server.");
    db.close();
  });
};
// 插入
var insertDocument = function(db, callback) {
  db.collection("restaurants").insertOne({
    "address": {
      "street": "2 Avenue",
      "zipcode": "10075",
      "building": "1480",
      "coord": [-73.9557413, 40.7720266]
    },
    "borough": "Manhattan",
    "cuisine": "Italian",
    "grades": [
      {
        "date": new Date("2014-10-01T00:00:00Z"),
        "grade": "A",
        "score": 11
      },
      {
        "date": new Date("2014-01-16T00:00:00Z"),
        "grade": "B",
        "score": 17
      }
    ],
    "name": "Vella",
    "restaurant_id": "41704620"
  }, function(err, result) {
    assert.equal(err, null);
    console.log("Inserted a document into the restaurants collection.");
    callback(result);
  });
};

var findRestaurants3 = function(db, callback) {
  // all records
  // var cursor =db.collection('restaurants').find( );
  // Query by a Top Level Field
  var cursor = db.collection("restaurants").find({ "name": "The Belgian Cupcake" });
  // Query by a Field in an Embedded Document
  // var cursor =db.collection('restaurants').find( { "address.zipcode": "10075" } );
  cursor.each(function(err, doc) {
    assert.equal(err, null);
    if (doc != null) {
      console.dir(doc);
    } else {
      callback();
    }
  });
};

var updateRestaurants = function(db, callback) {
  db.collection("restaurants").updateOne(
    { "restaurant_id": "50002876" },
    { $set: { "address.street": "East 31st Street" }},
    function(err, results) {
      if (err) {
        console.error("Error", err);
      } else {
        console.log(results);
        callback();
      }
    });
};

MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  insertDocument(db, function() {
    db.close();
  });
});

MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  findRestaurants3(db, function() {
    db.close();
  });
});

MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  updateRestaurants(db, function() {
    db.close();
  });
});
module.exports = MongoClient;
