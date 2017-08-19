'use strict';

let cheerio = require('cheerio');
const cDburl = 'mongodb://100td:27117/test';
let MongoClient = require('mongodb').MongoClient
    ,assert = require('assert');

let xlsx = require('node-xlsx');
let fs = require('fs');
const cXlsPath = './';


const cCurrentDate = formatDate(new Date(),'yyyyMMdd');

export2xls();


function export2xls() {
    MongoClient.connect(cDburl, function (err, db) {
        console.log('export2xls：连接成功');
        selectData(db, function (result) {
            let data_content = [
                ['单价', '总价', '户型','面积','小区名']
            ];  //JSON数组，第一行是Excel表头
            for (let i = 0; i < result.length; i++) {
                let arry = [
                    result[i].uprice,
                    result[i].tprice,
                    result[i].layout,
                    result[i].size,
                    result[i].hrname
                    //formatDate(result[i].create_time, 'yyyy-MM-dd hh:mm:ss')
                ];
                //console.log(arry);
                data_content.push(arry);
                // 将读取的所需列加入到JSON数组
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

function selectData(db, callback) {
    let collection = db.collection('esf'); //哪个表
    collection.find().sort({'uprice':1}).toArray(function(err, result) {  //读取60条数据
        if (err) {
            console.log('出错：' + err);
            return;
        }
        callback(result);
    });
}

function formatDate(date, style) {
    let y = date.getFullYear();
    let M = "0" + (date.getMonth() + 1);
    M = M.substring(M.length - 2);
    let d = "0" + date.getDate();
    d = d.substring(d.length - 2);
    let h = "0" + date.getHours();
    h = h.substring(h.length - 2);
    let m = "0" + date.getMinutes();
    m = m.substring(m.length - 2);
    let s = "0" + date.getSeconds();
    s = s.substring(s.length - 2);
    return style.replace('yyyy', y).replace('MM', M).replace('dd', d).replace('hh', h).replace('mm', m).replace('ss', s);
}
