var MongoClient = require('mongodb').MongoClient
    ,assert = require('assert');

var options = {
    server: {
        auto_reconnect: true,
        poolSize: 10
    }
};

var url = 'mongodb://100td:27117/test';
MongoClient.connect(url,function (err,db) {
    assert.equal(null,err);    //assert.equal(actual, expected, [message])，当actual和expected不相等时才输出message
    console.log("Connection successfully to server");
    var circm = {name:'ccc'};

    insertDocuments(db,function () {
        updateDocument(db,function () {
            findDocumentsBy(db,function(){
                deleteDocument(db,function () {
                    createIndex(db,function () {
                        db.close();
                    },circm);
                },circm);
            },circm);
        },circm);
    });


});

var findDocuments = function(db,callback){
  var userc = db.collection('userc');
  userc.find({}).toArray(function (err, docs) {
      assert.equal(err,null);
      console.log('Found the following records');
      console.log(docs);
      callback(docs);
      });
};

var findDocumentsBy = function(db,callback,circm){
    var userc = db.collection('userc');
    userc.find(circm).toArray(function (err, docs) {
        assert.equal(err,null);
        console.log('Found the following records');
        console.log(docs);
        callback(docs);
    });
};


var insertDocuments = function(db,callback) {
    var userc = db.collection('userc');
    userc.insertMany([
        {name: 'aaa', email: 'aaa@aaa.com'},
        {name: 'bbb', email: 'bbb@bbb.com'},
        {name: 'ccc', email: 'ccc@ccc.com'}
    ], function (err, result) {
        assert.equal(err, null);
        assert.equal(3, result.result.n); //result包括了result的document
        assert.equal(3, result.ops.length); //ops是包括了_id的document
        console.log("Inserted 3 documents into the collection");
        callback(result);

    });
};
//[{method:'insert/update/find/delete',docname:,where:,set:,orderby:},{},{}]
var updateDocument = function (db,callback,circm) {
    var userc = db.collection('userc');
    userc.updateOne(circm,{$set:{email:'sh_ek@126.com'}},function(err,result){
        assert.equal(err, null);
        console.log('set '+circm+' email sh_ek@126.com');
        callback(result);
    });
};

var deleteDocument = function (db,callback,circm) {
    var userc = db.collection('userc');
    userc.deleteOne(circm,function(err,result) {
        assert.equal(err, null);
        console.log('delete ' + circm.name + ' email sh_ek@126.com');
        callback(result);
    });
};

var createIndex = function (db,callback,circm) {
    var userc = db.collection('userc');
    userc.createIndex({name:1,email:-1},function (err,result) { // 指定1表示增续索引，指定2表示降序索引
        assert.equal(err, null);
        console.log('index is created ' + circm.name + '');
        callback(result);
    })
}

