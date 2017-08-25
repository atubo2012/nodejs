'use strict';


let http = require('http');
let cheerio = require('cheerio');
let config = require('./config');
let ut  = require('./utils');
let today = ut.formatDate(new Date(),'yyyyMMdd');

const cDburl = config.cDburl;
let MongoClient = require('mongodb').MongoClient
    ,assert = require('assert');

saveHrAvgPrice();

/**
 * 用aggregate生成各小区的"当日均价"=SUM(各房源的总价)/SUM(各房源面积)
 */

function saveHrAvgPrice() {

    MongoClient.connect(cDburl, function (err, db) {

        console.log('连接DB成功！');
        genHrAvgPrice(db, function (result) {

            console.log('生成小区均价为：'+JSON.stringify(result));
            //准备数据库操作的
            let circm = {
                tbnm: 'hrhis',
                sel: {'显示字段1': 1, '显示字段2': 1, '显示字段3': 1, '_id': 0},
                where: {name: /这里是like的内容/},
                insertdt: result,  //将被插入数据库的数据(数组结构)
                updatedt: {$set: {email: '这里设置要对字段更新的内容'}},
                deletedt: {name: /这里填写删除的条件/},
                logmsg:'保存小区均价信息到数据库:'
            };

            console.log('保存小区均价....');
            let coll = db.collection(circm.tbnm);
            coll.insertMany(circm.insertdt, function (err, r) {
                assert.equal(err, null);
                assert.equal(circm.insertdt.length, r.result.n); //result包括了result的document
                assert.equal(circm.insertdt.length, r.ops.length); //ops是包括了_id的document
                console.log(circm.logmsg + circm.tbnm+' 共'+r.result.n+'条。');


                console.log('开始遍历小区均价信息，更新房源信息中本日的均价字段......');

                for(let i=0; i<result.length;i++)
                {
                    let _id = result[i]._id;
                    let _hrname = _id.substr(0,_id.indexOf('-'));
                    let _avgPrice = result[i]._avg*10000; //单价更新成元为单位
                    _avgPrice = _avgPrice.toFixed(0); //去除小数点



                    db.collection('esf').updateMany(
                        {'cd':{$eq:today},'hrname':{$eq:_hrname}},//当日小区的均价
                        {$set :{'hrap':Number(_avgPrice)}},
                        function (err,r) {
                            assert.equal(err, null);
                            console.log('小区['+_hrname+']的均价被更新['+r.result.n+']条。均价：['+_avgPrice+']')
                        });
                    if (i === (result.length - 1)) {
                        db.close();  // 关闭数据库连接
                        console.log(i+'关闭DB成功。');
                    }
                }
            });
        });
    });
}

/**
 * 用aggregate汇总各小区的总面积和总价格
 * @param db
 * @param callback
 */
function genHrAvgPrice(db, callback) {
    let collection = db.collection('esf'); //哪个表
    collection.aggregate([
        {$match:{cd:today}},
        {$group:{
            _id:{$concat:['$hrname','-','$cd']},
            _tpamt:{$sum:'$tprice'},
            _tsize:{$sum:'$size'}
        }},
        {$project:{_id:1,_tpamt:1,_tsize:1,_avg:{$divide:['$_tpamt','$_tsize']}}},
        {$sort:{_avg:1}}
    ]).toArray(function (err, result) {
        if (err) {
            console.log('出错：' + err);
            return;
        }
        callback(result);
    });
}