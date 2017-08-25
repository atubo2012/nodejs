'use strict';

let cheerio = require('cheerio');
let config = require('./config');
let ut  = require('./utils');
const cDburl = config.cDburl;
const cXlsPath = config.cExlExpPath;

let MongoClient = require('mongodb').MongoClient
    ,assert = require('assert');


let xlsx = require('node-xlsx');
let fs = require('fs');

const cCurrentDate = ut.formatDate(new Date(),'yyyyMMdd');

export2xls();

/**
 * 将数据导出为excel
 */
function export2xls() {
    MongoClient.connect(cDburl, function (err, db) {
        console.log('export2xls：连接成功');
        selectData2(db, function (result) {
            let data_content = [];
            data_content.push(config.cEsfFieldsName2);  //第一行是Excel表头，可以在这里手工定制
            for (let i = 0; i < result.length; i++) {
                let esf = result[i];

                //将每条房源的各个字段信息转换成数组，组装成一条房源记录
                let arry = [];

                //根据配置的列名顺序来组装导出每一条要导出的数据
                let fieldNameList = Object.keys(config.cEsfFields2);
                for(let j=1;j<fieldNameList.length;j++)
                {
                    let fieldName = fieldNameList[j];
                    if(fieldName==='bsr')
                    {
                        esf[fieldName] = esf[fieldName].toFixed(2);
                    }
                    arry.push(esf[fieldName]);
                }
                //将单条房源记录加入到所有记录中
                data_content.push(arry);
            }

            db.close();  // 关闭数据库连接

            let file = xlsx.build([{
                name: '底单价房源',
                data: data_content
            }]);   //构建xlsx对象
            fs.writeFileSync(cXlsPath+cCurrentDate+'.xlsx', file, 'binary'); // 写入
            console.log('export2xls：文件写入完成。');
        });
    });
}


/**
 * 使用aggregate方式在结果集中生成导出的数据
 * @param db
 * @param callback
 */
function selectData2(db, callback) {
    let collection = db.collection('esf'); //哪个表
    collection.aggregate([
        {$match:{cd:cCurrentDate}},
        {$project:config.cEsfFields2},
        {$sort:config.cEsfSortBy2}
    ]).toArray(function (err, result) {
        if (err) {
            console.log('出错：' + err);
            return;
        }
        console.log(result);
        callback(result);
    });
}

/**
 * 使用find方式在结果集中生成导出的数据。
 * @param db
 * @param callback
 */
function selectData(db, callback) {
    let collection = db.collection('esf'); //哪个表
    collection.find(
        {'cd':cCurrentDate},
        config.cEsfFields).sort(config.cEsfSortBy).toArray(function(err, result) {  //读取60条数据
        if (err) {
            console.log('出错：' + err);
            return;
        }
        callback(result);
    });
}

