'use strict';

let http = require('http');
let cheerio = require('cheerio');

const cDburl = 'mongodb://100td:27117/test';
let MongoClient = require('mongodb').MongoClient;
let assert = require('assert');


/**
 * 【目标】
 *  生成行政区、版块信息。
 *  每条信息的构成：1、中文描述；2、英文简称
 *  dist[
 *      {name:pudongxinqu,title:"浦东新区",zone[{name:tangqiao,title:"塘桥"},{}]},
 *      {name:changning,title:"长宁",zone:[{name:tianshan,title:"天山"},{}]},
 *  ]
 *
 * 【算法】
 * 遍历所有行政区(div.level1)，建立dist数组
 *      遍历dist中每个行政区，获得小区内的所有版块(div.level2)，建立zone数组，添加到dist数组(dists["zones"] = zones);
 *          解析版块信息，加入到zone。
 * @type {string}
 */

//设置采集参数
let gSiteUrl = 'http://sh.lianjia.com';
let gInitUrl = gSiteUrl + '/ershoufang/pudongxinqu';

let gDistData = [];       //解析后的全部结果
let gZoneData = [];//板块信息
let url = 'http://sh.lianjia.com/ershoufang/pudongxinqu';


dcDist(url);

//dcZone();

/**
 * 采集行政区信息
 * @param url 采集页面的url
 * todo:util中新增一个dcUtil(url,parser,callback)函数，用于采集、解析、入库/写文件。
 */
function dcDist(url) {
    http.get(url, function (res) {
        let _html = '';
        res.on('data', function (data) {
            _html += data;
        });
        res.on('end', function () {
            parseDist(_html);
            dcZone();
        });
        res.on('error', function (e) {
            console.error(e.message);
        })
    });
}


/**
 * 解析行政区信息
 * @param html
 */
function parseDist(html) {

    let $ = cheerio.load(html);

    let dists = $('a.level1-item');//定位行政区的信息

    dists.each(function () {
        let dist = $(this);

        let _title = dist.text(); //标题
        let _url = dist.attr('href');//url
        let _name = dist.attr('gahref');//拼音简称

        //如果本条不是“不限”则将结果加入到数组
        if(_name !=='district-nolimit' && _name !=='line-nolimit'){
            let distInfo = {
                name: _name,
                title: _title,
                url: _url
            };
            gDistData.push(distInfo);
        }
    });
    console.log('一共'+gDistData.length+'个行政区:'+JSON.stringify(gDistData));

}

/**
 * 采集板块信息
 * 根据采集到的行政区，采集每个行政区下的板块信息。
 */
function dcZone(){
    for(let i=0;i<gDistData.length;i++)
    {
        let _url = gSiteUrl + gDistData[i].url;

        http.get(_url, function (res) {
            let _html = '';
            res.on('data', function (data) {
                _html += data;
            });
            res.on('end', function () {
                console.log(_url+'行政区的html已获得');
                parseZone(_html,gDistData[i]);
            });
            res.on('error', function (e) {
                console.error(e.message);
            })
        });
    }
}

/**
 * 解析特定行政区下的板块信息
 * @param html
 * @param currentDist
 */
function parseZone(html,currentDist){

    let $ = cheerio.load(html);

    let zones = $('div.level2-item');//定位板块信息

    let amt = zones.length;
    zones.each(function () {
        let zone = $(this).find('a');

        let _title = zone.text(); //标题
        let _url = zone.attr('href');//url
        let _name = zone.attr('gahref');//拼音简称

        //如果本条不是“不限”则将结果加入到数组
        if(_name !=='plate-nolimit'){
            let zoneInfo = {
                name: _name,
                title: _title,
                url: _url,
                dname : currentDist.name,
                dtitle: currentDist.title,
                durl:currentDist.url
            };
            gZoneData.push(zoneInfo);
            console.log('正在生成板块信息:'+gZoneData.length+':'+JSON.stringify(zoneInfo));
            save2db('zone',new Array(zoneInfo));
        }
    });
}

/**
 * 将板块信息保存到数据库中
 * @param tbnm
 * @param data
 */
function save2db(tbnm,data) {
    MongoClient.connect(cDburl,function (err,db) {
        assert.equal(null, err);    //assert.equal(actual, expected, [message])，当actual和expected不相等时才输出message
        console.log("Connection successfully to server");

        let circm = {
            tbnm: tbnm,
            sel: {'username': 1, 'name': 1, 'email': 1, '_id': 0},
            where: {name: /a/},
            insertdt: data,
            updatedt: {$set: {email: 'sh_ek@126.com'}},
            deletedt: {name: /王雪/}
        };

        let coll = db.collection(circm.tbnm);
        coll.insertMany(circm.insertdt, function (err, result) {
            assert.equal(err, null);
            assert.equal(circm.insertdt.length, result.result.n); //result包括了result的document
            assert.equal(circm.insertdt.length, result.ops.length); //ops是包括了_id的document
            console.log('保存板块信息到数据库: ' + circm.tbnm+' 共'+result.result.n+'条。');
            //callback(result); //todo:确认callback函数的用法
        });


        db.close();
        console.log('保存完成，关闭数据库。');

    });
}