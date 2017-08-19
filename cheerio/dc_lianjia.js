'use strict';

let http = require('http');
let cheerio = require('cheerio');
const cDburl = 'mongodb://100td:27117/test';
let MongoClient = require('mongodb').MongoClient
    ,assert = require('assert');

let xlsx = require('node-xlsx');
let fs = require('fs');


//设置采集参数
let gSiteUrl = 'http://sh.lianjia.com';
let gInitUrl = gSiteUrl + '/ershoufang/lujiazui/s1'; //访问链接，以特定板块为入口，查询版块内的房源单价升序查询，只查前60个单价最低的。//TODO：板块入口地址做成参数化文件。
let gCurrentUrl = gInitUrl; //当前页为初始页

let gNextPageUrl = '';      //"下一页"的url，根据该字段的值判断是否继续遍历下一页。
const cSleepTime = 2780;    //前后两次http访问之间的间隔时间，防止被反爬虫策略阻断。单位是毫秒。
let gCurrentPageNum = 0;    //初始的页面序号为0，开始解析html内容的时候，会自动加1
const cMaxPageNum = 2;    //采集的记录的页数，该参数会影响单个进程的内存上限。todo：将该参数分成开发模式和生产模式配置
let gParsedData = [];       //解析后的全部结果
const cCurrentDate = new Date().toLocaleDateString(); //当前日期，入库标准字段。

//数据采集、解析入库
dc();

/**
 * 主调函数：采集、入库
 */
function dc() {
    try {
        http.get(gCurrentUrl, function (res) {

            let _htmlcontent = '';
            res.on('data', function (data) {
                _htmlcontent += data;
            });

            res.on('end', function () {
                //接收完全部数据后解析数据
                parseEsf(_htmlcontent);

                if ('' !== gNextPageUrl && gCurrentPageNum<cMaxPageNum) {
                    setTimeout(function () {
                        gCurrentUrl = gNextPageUrl;
                        dc();
                    }, cSleepTime);
                }
                else{
                    //达到最后一页则退出
                    save2db(gParsedData);
                }
            });

            res.on('error', function (e) {
                console.error(e.message);
            })
        });

    } catch (e) {
        console.error('gCurrentUrl=[' + gCurrentUrl + ']');
        console.error('gCurrentPageNum=[' + gCurrentPageNum + ']');
        console.error('exception=[' + e + ']');
    }

}


/**
 * 解析链家二手房列表页信息
 * @param html
 */
function parseEsf(html) {
    console.log('==================正在解析第' + ++gCurrentPageNum + '页');
    let $ = cheerio.load(html);

    let esfs = $('div.info');//定位每条房源信息最内侧的元素<div class='info'>
    esfs.each(function () {
        let esf = $(this);

        //以下代码按照界面中的信息块进行分段

        let dblk = esf.find('a.text');
        let _title = dblk.text(); //标题
        let _url = dblk.attr('href');//url

        dblk = esf.find('.row1-text').text().split('|');
        let _layout = dblk[0].trim(); //房型
        let _size = Number(dblk[1].trim().replace('平','')); //面积
        let _floor = dblk[2].trim(); //楼层
        let _drct = dblk[3]; //朝向
        if (undefined === _drct) {
            _drct = '[未填]';
        } else {
            _drct = _drct.trim();
        }

        dblk = esf.find('a.laisuzhou');
        let _hrurl = dblk.attr('href'); //小区链接
        let _hrname = dblk.find('span').text(); //小区名

        dblk = dblk.siblings('a');  //todo：验证是否其他属性也可以按照“行政区”和“板块”值的采集模式。减少对dom的查找操作，提升效率。
        let _dist = dblk[0].children[0].data.trim();//行政区
        let _zone = dblk[1].children[0].data.trim();//板块

        let _tprice = Number(esf.find('.total-price').text());//总价，入库前需要用Number()转换型数值类型
        let _uprice = Number(esf.find('.minor').text().trim().replace('单价','').replace('元/平',''));//单价

        let _tags = []; //标签亮点
        esf.find('span.c-prop-tag2').each(function () {
            let _tag = $(this);
            _tags.push(_tag.text());
        });

        //组合单条二手房信息结构，按照从微观到宏观的方式
        let esfInfo = {
            uprice: _uprice,    //单价，决定收益，要与小区均价、评估均价
            tprice: _tprice,    //总价，
            hrname: _hrname,    //小区名
            floor: _floor,      //楼层
            layout: _layout,    //户型
            drct: _drct,        //朝向
            zone:_zone,         //板块
            sdist:_dist,        //行政区
            tags: _tags,         //地铁距离、年限
            size:_size,         //面积
            title: _title,      //房源描述
            hrurl:gSiteUrl+_hrurl, //小区url
            url: gSiteUrl+_url   ,  //房源url
            cd: cCurrentDate,       //当前日期
            ct: new Date().toLocaleTimeString() //时间戳
        };

        //将本条房源信息加入结果集
        gParsedData.push(esfInfo);
    });


    //如果最后一个翻页链接是“下一页”，则设置下一页的URL，为下次遍历做好参数准备
    //对要解析的内容有两种定位方法（1）通过关键字查找定位（2）通过遍历children子元素定位
    let lastPageLink = $('div.c-pagination').children().last();
    let lastPageTitle = lastPageLink.text().trim();
    if (lastPageTitle === '下一页') {
        gNextPageUrl = gSiteUrl + lastPageLink.attr('href');
    } else {
        gNextPageUrl = '';
    }

    console.log('gNextPageUrl=' + gNextPageUrl);

}

function save2db() {
    MongoClient.connect(cDburl,function (err,db) {
        assert.equal(null, err);    //assert.equal(actual, expected, [message])，当actual和expected不相等时才输出message
        console.log("Connection successfully to server");

        let circm = {
            tbnm: 'esf',
            sel: {'username': 1, 'name': 1, 'email': 1, '_id': 0},
            where: {name: /a/},
            insertdt: gParsedData,
            updatedt: {$set: {email: 'sh_ek@126.com'}},
            deletedt: {name: /王雪/}
        };

        let coll = db.collection(circm.tbnm);
        coll.insertMany(circm.insertdt, function (err, result) {
            assert.equal(err, null);
            assert.equal(circm.insertdt.length, result.result.n); //result包括了result的document
            assert.equal(circm.insertdt.length, result.ops.length); //ops是包括了_id的document
            console.log('保存房源信息到数据库: ' + circm.tbnm+' 共'+result.result.n+'条。');
            //callback(result); //todo:确认callback函数的用法
        });


        db.close();
        console.log('保存完成，关闭数据库。');

    });
}
