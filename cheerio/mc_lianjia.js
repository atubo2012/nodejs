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

    ut.showLog('开始计算小区均价，连接DB');
    MongoClient.connect(cDburl, function (err, db) {

        genHrAvgPrice(db, function (result) {

            //console.log('生成小区均价为：'+JSON.stringify(result));
            //准备数据库操作的
            let circm = {
                tbnm: 'hrhis',
                sel: {'field1': 1, 'field2': 1, 'field3': 1, '_id': 0},
                where: {name: /like condition/},
                insertdt: result,  //将被插入数据库的数据(数组结构)
                updatedt: {$set: {email: '这里设置要对字段更新的内容'}},
                deletedt: {name: /condition/},
                logmsg:'保存小区均价信息到数据库:'
            };

            let coll = db.collection(circm.tbnm);
            coll.insertMany(circm.insertdt, function (err, r) {
                assert.equal(err, null);
                assert.equal(circm.insertdt.length, r.result.n); //result包括了result的document
                assert.equal(circm.insertdt.length, r.ops.length); //ops是包括了_id的document
                ut.showLog(circm.logmsg + circm.tbnm+' 共'+r.result.n+'条。');


                ut.showLog('开始更新房源的均价字段');
                for(let i=0; i<result.length;i++)
                {
                    let _id = result[i]._id;
                    let _hrname = _id.substr(0,_id.lastIndexOf('-')); //使用lastIndexOf是为了应对小区名字中有减号-，导致esf的hrap未设置成功
                    let _avgPrice = result[i]._avg*10000; //单价更新成元为单位
                    _avgPrice = _avgPrice.toFixed(0); //去除小数点

                    // ut.showLog("1--"+_id);
                    // ut.showLog("2--"+_hrname);
                    // ut.showLog("3--"+result[i]._avg);
                    // ut.showLog("4--"+_avgPrice);
                    // ut.showLog("5--"+Number(_avgPrice));

                    db.collection('esf').updateMany(
                        {'cd':{$eq:today},'hrname':{$eq:_hrname}},//当日小区的均价
                        {$set :{'hrap':Number(_avgPrice)}},
                        function (err,r) {
                            assert.equal(err, null);
                            ut.showLog(_hrname+'挂牌均价hrap='+_avgPrice);

                            //最后一条结束后则关闭数据库连接
                            if (i === (result.length - 1)) {
                                db.close();
                                ut.showLog('完成更新房源的均价字段，关闭DB');
                            }
                        });
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

//genTodayHr(db,callback)  根据当日的esf生成今日的小区信息
//