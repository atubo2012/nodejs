'use strict';

let MongoClient = require('mongodb').MongoClient;
let assert = require('assert');
/**
 * 将数据新增方式保存到mongodb数据
 * @param tbname cellection的名字
 * @param savedData 数组类型的数据，每个元素是一个数组
 * @param cDburl 数据库连接字符串
 */
exports.save2db =function (tbname,savedData,cDburl) {
    let log = require('./utils').showLog;

    MongoClient.connect(cDburl,function (err,db) {
        assert.equal(err,null);    //assert.equal(actual, expected, [message])，当actual和expected不相等时才输出message

        let coll = db.collection(tbname);
        coll.insertMany(savedData, function (err, result) {
            assert.equal(err, null);
            assert.equal(savedData.length, result.result.n); //result包括了result的document
            assert.equal(savedData.length, result.ops.length); //ops是包括了_id的document
            log('完成入库:' + tbname+' ，共入库'+result.result.n+'条。');
            //callback(result);
            db.close();
            //log('已关闭链接。');
        });
    });
};

exports.save2db2 =function (tbname,savedData,cDburl) {
    let log = require('./utils').showLog;
    //log('开始入库:'+tbname+':'+JSON.stringify(savedData));
    MongoClient.connect(cDburl,function (err,db) {
        assert.equal(err,null);    //assert.equal(actual, expected, [message])，当actual和expected不相等时才输出message

        let coll = db.collection(tbname);
        let t = require('assert');

        //在try内遍历数据，并用updateOne+upsert方式入库TODO:
        try{
            for(let i =0 ;i<savedData.length;i++){
                let record = savedData[i];

                coll.updateOne(
                    {'url': record.url},                   //filter
                    {$set: record, $currentDate: {'updt': true}}, //update
                    {upsert: true, w: 1},                   //option
                    function (err, r) {                     //callback
                        t.equal(null, err);
                        t.equal(1, r.result.n);
                        //console.log('更新二手房信息', record.title);

                        db.close();
                    });

                if(i===savedData.length-1){
                    db.close();
                }
            }
        }catch(e){
            console.log('插入二手房信息错误',e);
            db.close();
        }
    });
};

/**
 *
 * @param tbname
 * @param where 数组类型的条件：
 * [
 *  {
 *      $match:{
 *          $and:[{cd:cCurrentDate},{bsr:{$lte:'3'}}]
 *      }
 *  }，
 *  {$project:config.cEsfFields2},
 *  {$sort:config.cEsfSortBy2}
 * ]
 * @param cDburl
 * @param limit 返回记录的条数，可以用config文件中的maxFetchRecord参数
 * @param callback 回调函数，处理结果集中的内容
 */
exports.findFromDb =function (tbname,where,limit,cDburl,callback) {
    let log = require('./utils').showLog;
    log('开始读表:'+JSON.stringify(tbname)+':'+JSON.stringify(where));

    MongoClient.connect(cDburl, function (err, db) {
        assert.equal(null,err);
        let collection = db.collection(tbname); //哪个表

        collection.find(where).limit(limit).toArray(function(err, docs) {
            assert.equal(null, err);
            //assert.equal(limit, docs.length);

            console.log(tbname+'======',docs.length);

            db.close();

            callback(docs,db);

        });

    });

};


exports.findFromDb2 =function (tbname,where,flds,limit,cDburl,callback) {
    let log = require('./utils').showLog;
    log('开始读表:'+JSON.stringify(tbname)+':'+JSON.stringify(where));

    MongoClient.connect(cDburl, function (err, db) {
        assert.equal(null,err);
        let collection = db.collection(tbname); //哪个表

        collection.find(where,flds).limit(limit).toArray(function(err, docs) {
            assert.equal(null, err);
            //assert.equal(limit, docs.length);

            console.log(tbname+'======',docs.length);

            db.close();

            callback(docs,db);

        });

    });

};