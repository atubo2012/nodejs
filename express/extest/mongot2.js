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

    /**
     * 查询类条件的参数
     * @type {{tbnm: string, sel: {username: number, name: number, email: number, _id: number}, where: {}, set: {}}}
     */
    var circm = {
        tbnm:'userc',
        sel:{'username':1,'name':1,'email':1,'_id':0},
        where:{name:/a/},
        insertdt:[{name: '王雪', email: 'aa23a@aaa.com'},
                {name: 'a2bb', email: '3@bbb.com'},
                {name: 'cc3c', email: 'c3cc@ccc.com'}],
        updatedt:{$set:{email:'sh_ek@126.com'}},
        deletedt:{name:/王雪/}
    };


    insertDocuments(db,function () {
        //db.close();
    },circm);

    updateDocuments(db,function () {
        //db.close();
    },circm);

    deleteDocuments(db,function () {
        //db.close();
    },circm);

    findDocuments(db,function () {
        db.close();
    },circm);

});


var findDocuments = function(db,callback,circm){
    var coll = db.collection(circm.tbnm);
    coll.find(circm.where,circm.sel).toArray(function (err, docs) {
        assert.equal(err,null);
        console.log('Found the following records');
        console.log(docs);
        callback(docs);
    });
};

var insertDocuments = function(db,callback,circm) {
    var coll = db.collection(circm.tbnm);
    coll.insertMany(circm.insertdt, function (err, result) {
        assert.equal(err, null);
        assert.equal(circm.insertdt.length, result.result.n); //result包括了result的document
        assert.equal(circm.insertdt.length, result.ops.length); //ops是包括了_id的document
        console.log('Inserted  documents into the '+circm.tbnm);
        callback(result);

    });
};


var updateDocuments = function (db,callback,circm) {
    var coll = db.collection(circm.tbnm);
    coll.updateMany(circm.where,circm.updatedt,function(err,result){
        assert.equal(err, null);
        console.log('set '+circm.tbnm+' email sh_ek@126.com');
        callback(result);
    });
};

var deleteDocuments = function (db,callback,circm) {
    var coll = db.collection(circm.tbnm);
    coll.deleteMany(circm.deletedt,function(err,result) {
        assert.equal(err, null);
        console.log('delete ' + circm.tbnm + '');
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

