'use strict';

let MongoClient = require('mongodb').MongoClient;
let assert = require('assert');
/**
 * 新增方式保存到指定表中
 * @param tbname cellection的名字
 * @param savedData 数组类型的数据，每个元素是一个数组
 * @param cDburl 数据库连接字符串
 */
exports.save2db = function (tbname, savedData, cDburl) {

    MongoClient.connect(cDburl, function (err, db) {
        assert.equal(err, null);

        try {
            let coll = db.collection(tbname);
            coll.insertMany(savedData, function (err, result) {
                assert.equal(err, null);
                assert.equal(savedData.length, result.result.n);
                assert.equal(savedData.length, result.ops.length);
                console.log('完成入库:' + tbname + ' ，共入库' + result.result.n + '条。');
                db.close();

            });
        } catch (e) {
            console.error('save2db错误', e);
            db.close();
        }
    });
};


/**
 * 更新方式保存到指定表中。
 * 只打开一次数据库连接，在最后一条更新完成后关闭连接。
 * @param tbname
 * @param savedData
 * @param cDburl
 */
exports.save2db2 = function (tbname, savedData, cDburl) {
    MongoClient.connect(cDburl, function (err, db) {
        assert.equal(err, null);
        let coll = db.collection(tbname);
        let t = require('assert');

        try {
            for (let i = 0; i < savedData.length; i++) {
                let record = savedData[i];

                coll.updateOne(
                    {'url': record.url},
                    {$set: record, $currentDate: {'updt': true}},
                    {upsert: true, w: 1},
                    function (err, r) {
                        t.equal(null, err);
                        t.equal(1, r.result.n);
                    });

                if (i === savedData.length - 1) {
                    db.close();
                }
            }
        } catch (e) {
            console.log('插入信息错误', e);
            db.close();
        }
    });
};

/**
 * 在遍历数据的循环内逐个打开连接再upsert到数据库中，且支持根据设定的条件
 * 对数据库的链接开关频繁，不推荐使用。仅作为一种可行性供参考。
 * @param tbname
 * @param savedData
 * @param cDburl
 * @param filter
 */
// exports.save2db3 = function (tbname, savedData, cDburl, filter) {
//
//     MongoClient.connect(cDburl, function (err, db) {
//         assert.equal(err, null);
//         let coll = db.collection(tbname);
//         let t = require('assert');
//         try {
//             console.log('save2db3', savedData.length);
//             for (let i = 0; i < savedData.length; i++) {
//                 let record = savedData[i];
//
//                 coll.updateOne(
//                     filter,
//                     {$set: record, $currentDate: {'updt': true}},
//                     {upsert: true, w: 1},
//                     function (err, r) {
//                         t.equal(null, err);
//                         t.equal(1, r.result.n);
//                     });
//                 if (i === savedData.length - 1) {
//                     console.log('save2db2关闭数据库');
//                     db.close();
//                 }
//             }
//         } catch (e) {
//             console.log('插入信息错误', e);
//             db.close();
//         }
//     });
// };


/**
 * 删除指定表中的所有数据
 * @param tbname
 * @param cDburl
 */
exports.clearDb = function (tbname, cDburl) {
    MongoClient.connect(cDburl, function (err, db) {
        assert.equal(err, null);
        let coll = db.collection(tbname);
        coll.deleteMany({}, {w: 1}, function (err, r) {
            assert.equal(null, err);
            console.log('清理数据' + tbname + ':', r.nRemoved);
            db.close();
        });
    });
};

/**
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
exports.findFromDb = function (tbname, where, limit, cDburl, callback) {
    let log = require('./utils').showLog;
    log('开始读表:' + JSON.stringify(tbname) + ':' + JSON.stringify(where));

    MongoClient.connect(cDburl, function (err, db) {
        assert.equal(null, err);
        let collection = db.collection(tbname); //哪个表

        collection.find(where).limit(limit).toArray(function (err, docs) {
            assert.equal(null, err);
            //assert.equal(limit, docs.length);
            console.log(tbname + '======', docs.length);

            db.close();
            callback(docs, db);
        });

    });

};


exports.findFromDb2 = function (tbname, where, flds, limit, cDburl, callback) {
    let log = require('./utils').showLog;
    log('开始读表:' + JSON.stringify(tbname) + ':' + JSON.stringify(where));

    MongoClient.connect(cDburl, function (err, db) {
        assert.equal(null, err);
        let collection = db.collection(tbname); //哪个表

        collection.find(where, flds)
            .limit(limit)
            .toArray(function (err, docs) {
                assert.equal(null, err);
                //assert.equal(limit, docs.length);
                console.log(tbname + '======', docs.length);

                db.close();
                callback(docs, db);
        });
    });
};

/**
 * 用aggregate方式导出时数据
 * aggr的内容可以在配置文件中配置
 * 【场景】：exportBroker2()
 * @param tbname
 * @param aggr
 * @param cDburl
 * @param callback
 */
exports.findFromDb3 = function (tbname, aggr, cDburl,callback) {
    console.log('开始读表:' + JSON.stringify(tbname) + ':' + JSON.stringify(aggr));

    MongoClient.connect(cDburl, function (err, db) {
        assert.equal(null, err);
        let collection = db.collection(tbname); //哪个表

        collection.aggregate(aggr).toArray(function (err, result) {
            assert.equal(null, err);

            console.log('完成查询' + result.length + '条');
            db.close();

            callback(result);
        });
    });
};

