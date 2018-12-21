let dc = require('./cheerio/dcutils.js');
let cf = require('./cheerio/config');
let ut = require('./cheerio/utils');
let dbut = require('./cheerio/dbutils');
let dcut = require('./cheerio/dcutils');
let http = require('http');
let cheerio = require('cheerio');
let iconv = require('iconv-lite');
let fs = require('fs');
let assert = require('assert');
process.setMaxListeners(6000);


//被关注度股票，每日根据最新的价格，更新租售比。每增加一个，需要重新执行dcEps2()和updatePrice()
// let gFocusedStocks = ["600000","600369","600958","601166","601788",'600663','601988','600284','600109','600170','600068','002146','000926'];
let gFocusedStocks = ["601988","600369","600109","601166"];


//数据源：EPS历史数据，用来在初始化关注股的EPS是使用。
let gSiteUrl = 'http://money.finance.sina.com.cn';
let gPageUrl = '/corp/go.php/vFD_FinanceSummary/stockid/';

//
let gAllStocks = [];    //所有的股票代码，用来在爬取股票代码时使用。
let gStockCodes = [];
let gStockCode = '';
let gTotalPage = 0;
let gCurrentIndex = 0;


let eps = [];

//数据源：全量股票代码
let gSiteUrl2 = 'http://quote.eastmoney.com';
let gPageUrl2 = '/stocklist.html';


function main(){

    //getAllStockCodes2db();

    //writeAllStockCode2Ffile();

    //dcEps2();

    updatePrice();
}

main();

//采集所有的股票代码保存到stock表。
function getAllStockCodes2db() {
    dcut.dc(gSiteUrl2, gPageUrl2, paserStockCodes, dpStockCodes, 1000);
}



/**
 * 生成所有股票代码的数据，保存到文件
 */
function writeAllStockCode2Ffile() {
    let MongoClient = require('mongodb').MongoClient;
    MongoClient.connect(cf.cDburl, function (err, db) {
        let col = db.collection('stocks');

        try {
            col.find({},{'_id':0})
                .toArray(function (err, docs) {
                    assert.equal(null, err);
                    db.close();

                    docs.forEach((item, index, arr) => {
                        gAllStocks.push(item);
                    });
                    console.log(gAllStocks.length);

                    ut.wf('allstocks.txt', JSON.stringify(gAllStocks));
                });
        } catch (e) {
            console.log('插入信息错误', e);
        }
    });
}


function dcEps2() {

    dbut.clearDb('rsr',cf.cDburl);
    //gStockCodes = gFocusedStocks;
    try {

        gStockCode = gFocusedStocks[0];
        gTotalPage = gFocusedStocks.length;
        gNextPageUrl = gPageUrl + gStockCode + '.phtml';
        dc.dc(gSiteUrl, gNextPageUrl, paser, dp, 1000);

    } catch (e) {
        console.log('插入信息错误', e);
    }

}

function paser(html, dataProcessor) {

    //加载页面内容
    let $ = cheerio.load(html);

    //定位财报数据
    let finData = $('table#FundHoldSharesTable').find('tbody').find('tr');//.find('tbody').find('tr.gray');

    let currentDate = '';
    let currentEps = '';

    try {
        finData.each(function () {
            let tr = $(this);
            let td = $(this).find('td');

            let td0 = td['0'];
            let td1 = td['1'];

            let temp = '';

            if (td0.children.length === 2) {
                currentDate = td0.children[0].attribs.name;
                //console.log('日期',td0.children[0].attribs.name);
            } else if (td0.children.length === 1) {
                temp = td0.children[0].data;

                if (temp === '每股收益-摊薄/期末股数' && td1.children) {
                    let temp2 = '';
                    if (td1.children[0].children)
                        temp2 = td1.children[0].children[0].data;
                    else
                        temp2 = td1.children[0].data;

                    /**
                     *  根据财报发布时间调整if()中第二个条件
                     *  1季报发布后：2018-03-
                     *  2季报发布后：2018-06-
                     *  3季报发布后：2018-09-
                     *  年报发布后：2018-12-
                     */

                     if (currentDate.indexOf('-12-') >= 0 || currentDate.indexOf('2018-09-') >= 0) {
                    //if (currentDate.indexOf('2018-09-')) {
                        currentEps = Number(temp2.replace('元', ''));

                        if (currentDate.indexOf('-03-') >= 0)
                            currentEps = (currentEps * 4).toFixed(4);
                        else if (currentDate.indexOf('-06-') >= 0)
                            currentEps = (currentEps * 2).toFixed(4);
                        else if (currentDate.indexOf('-09-') >= 0)
                            currentEps = (4*(currentEps /3)).toFixed(4);

                        console.log('日期2:'+currentDate,currentEps);
                        eps.push({'date': currentDate, 'eps': Number(currentEps)});
                    }
                }
            }
        });

    } catch (error) {
        console.error(error);
    }
    dataProcessor(eps);

    //翻页处理
    if (gCurrentIndex < gTotalPage - 1) {
        gCurrentIndex = gCurrentIndex + 1;
        gStockCode = gFocusedStocks[gCurrentIndex];
        gNextPageUrl = gPageUrl + gStockCode + '.phtml';

    } else {
        gNextPageUrl = '';
    }
    return gNextPageUrl;
}

/**
 * 加入证券代码，查询当日收盘价，计算每股收益率，更新数据库
 * @param leps
 */
function dp(leps) {
    let data = [{'code': gStockCode, 'eps': leps}];
    console.log('以下数据应该被保存入库\n', data);
    dbut.save2db('rsr', data, cf.cDburl);
    eps = [];
}

/**
 * 遍历股票代码，查询价格更新当日价格
 * 按照当日价格计算租售比
 * 发送今日租售比最高的10个个股到群里
 */
function updatePrice() {

    try {

        gFocusedStocks.map((item, index, arr) => {

            let code = '';

            //根据证券代码设置查询参数
            if (item.startsWith('60'))
                code = 'sh' + item;
            if (item.startsWith('00'))
                code = 'sz' + item;


            ut.httpxReq('http', 'hq.sinajs.cn/list=' + code, (result) => {
                //解析信息，获得证券名称，获取证券名称对应的esp信息，根据今日价格计算租售比

                result = result.substring(result.indexOf('=') + 1).replace(';', '').replace('"', '').replace('"', '').split(',');

                let stockName = result[0];
                let price = Number(result[3]).toFixed(2);
                console.log(item, stockName, price);

                let MongoClient = require('mongodb').MongoClient;
                MongoClient.connect(cf.cDburl, function (err, db) {
                    let coll = db.collection('rsr');
                    try {
                        coll.find({'code': item}, {'code': '1', 'eps.eps': '1', 'eps.date': '1', '_id': '-1'})
                            .toArray(function (err, docs) {

                                let rsr = ((Number(docs[0].eps[0].eps) / price) * 100).toFixed(2);
                                console.log(stockName, rsr, item, JSON.stringify(docs[0]));

                                coll.updateOne(
                                    {'code': item},
                                    {$set: {name: stockName, price: Number(price), rsr: Number(rsr)}},
                                    {upsert: true, w: 1},
                                    function (err, r) {
                                        assert.equal(null, err);
                                        assert.equal(1, r.result.n);
                                        db.close();
                                    });
                            });

                    } catch (e) {
                        console.log('插入信息错误', e);
                        db.close();
                    }
                });
            })
        })

    } catch (e) {
        console.log('插入信息错误', e);

    }

}

function paserStockCodes(html, dataProcessor) {

    console.log(html);
    //加载页面内容
    let $ = cheerio.load(html);
    //定位股票代码
    let finData = $('div#quotesearch').find('ul').find('li').find('a');//.find('tbody').find('tr.gray');

    let currentStockCode = '';
    let currentStockName = '';

    try {
        finData.each(function () {
            let item = $(this)['0'];

            if (item.children && item.children.length === 1) {//&& item.children[0].data.startsWith('60')){
                currentStockCode = item.children[0].data;
                currentStockName = currentStockCode.substring(0, currentStockCode.indexOf('('));
                currentStockCode = currentStockCode.substring(currentStockCode.indexOf('(') + 1, currentStockCode.indexOf(')'));

                if(!(currentStockCode.startsWith('15')||
                    currentStockCode.startsWith('16')||
                    currentStockCode.startsWith('20')||
                    currentStockCode.startsWith('R')||
                    currentStockCode.startsWith('05')||
                    currentStockCode.startsWith('5')||
                    currentStockCode.startsWith('R'))
                )
                    gAllStocks.push({code: currentStockCode, name: currentStockName});

            }

            console.log(currentStockCode, currentStockName);
        });

    } catch (error) {
        console.error(error);
    }
    dataProcessor(gAllStocks);

    return '';
}

function dpStockCodes(data) {
    console.log(data);
    let MongoClient = require('mongodb').MongoClient;
    MongoClient.connect(cf.cDburl, function (err, db) {
        let col = db.collection('stocks');
        try {
            col.insertMany(gAllStocks,
                function (err, r) {
                    assert.equal(err, null);
                    console.log('更新完毕', r);
                    db.close();
                });
        } catch (e) {
            console.log('插入信息错误', e);
        }
    });
}