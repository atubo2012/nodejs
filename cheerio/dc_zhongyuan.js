'use strict';

let cheerio = require('cheerio');
let ut = require('./utils.js');
let dbut = require('./dbutils.js');
let cf = require('./config.js');

let gSiteUrl = 'http://sh.centanet.com';
let dc = require('./dcutils.js');

let dsName = 'zy';
let zone = 'beiwaitan';

main();


function main() {
    process.setMaxListeners(cf.cMaxListener);
    let args = process.argv.splice(2);
    let _instruct = args[0];
    zone = args[1];


    if (args.length < 1) {
        console.error('应指定指令名参数，如：node dc_zhongyuan.js dczone beiwaitan');
    } else {

        if ('dchr' === _instruct) {

            if (zone === undefined) {
                ut.showLog('未指定板块名，应指定板块名！');
            } else {
                ut.showLog('开始采集板块内小区......');
                dc.dc(gSiteUrl, '/xiaoqu/' + zone + '/', zonePaser4zy, zoneDp4zy, cf.cMaxPageNum);
            }
        } else if ('dcesf' === _instruct) {

            if (zone === undefined) {
                ut.showLog('未指定板块名，应指定板块名！');
            } else {
                ut.showLog('开始采集板块内二手房......');
                dc.dc(gSiteUrl, '/ershoufang/' + zone + '/', esfPaser4zy, esfDp4zy, cf.cMaxPageNum);
            }

        } else if ('setap' === _instruct) {

            ut.showLog('开始设置二手房的均价......');

            dbut.findFromDb('zyzone', {cd: ut.getToday()}, cf.cMaxRcd, cf.cDburl, setEsfAvgPrice);

        } else if ('mccfmd' === _instruct) {

            ut.showLog('开始计算二手房的折扣率......');

            dbut.findFromDb('zyesf', {cd: ut.getToday()}, cf.cMaxRcd, cf.cDburl, setEsfDisct);

        } else if ('expdata' === _instruct) {

            ut.showLog('开始导出数据......');

            export2xls(cf.cDburl, dsName + 'esf');

        } else {

            ut.showLog(_instruct + '不是合法的指令，合法的指令包括：dczone|dcesf|setap|mccmfd|expdata');
        }

    }


    //采集板块内的小区信息
    //dc.dc(gSiteUrl, '/xiaoqu/'+zone+'/' , zonePaser4zy, zoneDp4zy,cf.cMaxPageNum);

    //采集版块内二手房信息
    //dc.dc(gSiteUrl,'/ershoufang/'+zone+'/',esfPaser4zy,esfDp4zy,cf.cMaxPageNum);

    //查询各小区的均价数据，并设置小区内二手房的均价，以便下一步计算
    //dbut.findFromDb('zyzone', {cd: ut.getToday()}, 5000, cf.cDburl, setEsfAvgPrice);

    //根据折扣率计算公式，计算二手房的折扣率
    //dbut.findFromDb('zyesf', {cd: ut.getToday()}, 5000, cf.cDburl, setEsfDisct);

    //导出
    //export2xls(cf.cDburl, dsName + 'esf');

}


function zonePaser4zy(html, dataProcessor) {

    let nextPageUrl = '';
    let results = [];//对数据解析后的内容

    let $ = cheerio.load(html);
    let _nowtime = ut.formatDate(new Date(), 'hhmmss');


    let records = $('div.house-listBox').children();
    records.each(function () {
        let zone = $(this);

        let dblk = zone.find('a.cBlueB');
        let _hrname = dblk[0].attribs['title']; //ut.showLog(_hrname);
        let _url = dblk[0].attribs['href'];

        dblk = zone.find('p.f7b');
        let _longAddr = dblk[0].children[0].data.trim().split(' ');
        let _dist = _longAddr[0];
        let _zone = _longAddr[1];
        let _addr = _longAddr[2];
        let _bdyear = dblk[1].children[0].data.trim();

        //dblk = zone.find('.mrl_6');  // zone.find('a.cBlue mrl_6')查找不到对象，则用'.mrl_6'查找;

        dblk = zone.find('span.mr_10');
        let _esfAmt = '0套';
        let _czfAmt = '0套';

        //每个小区的二手房和租房为0套的情况下，在页面上不显示相应的节点。
        for (let i = 0; i < dblk.length; i++) {
            if ('二手房' === dblk[i].children[0].data.trim()) {
                _esfAmt = dblk[i].children[1].children[0].data.trim();
            } else if ('租房' === dblk[i].children[0].data.trim()) {
                _czfAmt = dblk[i].children[1].children[0].data.trim();
            }

        }

        dblk = zone.find('div.item-pricearea').find('span'); //通过查找两个标签来定位属性。
        let _uprice = dblk[0].children[0].data.replace('暂 无', '').replace('元/平', ''); //小区均价
        if (_uprice === '') {
            _uprice = 0;
        } else {
            _uprice = Number(_uprice);
        }


        let hrInfo = {
            hrname: _hrname,    //小区名
            uprice: _uprice,    //均价
            esfAmt: _esfAmt,
            czfAmt: _czfAmt,
            dist: _dist,
            zone: _zone,         //板块
            addr: _addr,        //小区地址
            bdyear: _bdyear,    //房屋建设年份
            url: gSiteUrl + _url,  //房源url
            cd: ut.getToday(),       //当前日期
            ct: _nowtime, //时间戳
            ds: 'zy'
        };

        results.push(hrInfo);
        //ut.showLog(JSON.stringify(hrInfo));
    });

    //检查是否有下一页，如果有'a.icons-righton'元素，则说明有下一页。
    let dblk = $('a.icons-righton');
    if (dblk.length !== 0) {
        nextPageUrl = dblk[0].attribs['href']; //下一页的url
    } else {
        nextPageUrl = '';
    }


    dataProcessor(results);//处理本页数据
    return nextPageUrl;


}

/**
 * 中原二手房数据解析函数
 * @param html
 * @param dataProcessor
 * @returns 下一页的url
 * TODO:与链家二手房数据有差别的字段：
 * 链家：floor(地区/6层)，drct(南)
 * 中原：floor(中层)，drct(朝南北）
 */
function esfPaser4zy(html, dataProcessor) {

    let nextPageUrl = '';
    let results = [];//对数据解析后的内容

    let $ = cheerio.load(html);
    let _nowtime = ut.getNow();
    let _today = ut.getToday();

    let records = [];
    records = $('div.house-listBox').children();//定位每条房源信息最内侧的元素
    //.children('div.house-item clearfix house-item-curr')

    records.each(function () {
        let esf = $(this);

        //以下代码按照界面中的信息块进行分段

        let dblk = esf.find('a');


        let _title = dblk[1].attribs['title']; //标题
        let _url = dblk[1].attribs['href'];//url
        let _hrname = dblk[2].children[0].data.trim(); //小区名
        let _hrurl = dblk[2].attribs['href']; //小区链接

        ut.showLog(_title);


        let _layout = dblk[2].next.children[0].data; //房型
        let _size = Number(dblk[2].next.next.children[0].data.replace('平', '')); //面积


        dblk = esf.find('p.f7b');
        let _drct = '[未填]';
        let _floor = '[未填]';
        let _bdyear = '[未填]';
        let _deco = '[未填]';

        for (let i = 0; i < dblk[0].children.length; i++) {
            let c = dblk[0].children[i].data;
            if (dblk[0].children[i].type === 'text') {
                c = c.trim();
                if (c.indexOf('年') >= 0) {
                    _bdyear = Number(c.replace('年', '')); //保持与爬取链家的数据内容一致：1999年建。
                }
                if (c.indexOf('南') >= 0 || c.indexOf('东') >= 0 || c.indexOf('西') >= 0 || c.indexOf('北') >= 0) {
                    _drct = c;
                }
                if (c.indexOf('层') >= 0) {
                    _floor = c;
                }
                if (c.indexOf('装') >= 0) {
                    _deco = c;
                }
            }
        }

        let _tmp = dblk[1].children[0].data.trim();

        let _dist = _tmp.split(' ')[0].split('-')[0];//行政区
        let _zone = _tmp.split(' ')[0].split('-')[1];//板块
        let _addr = _tmp.split(' ')[1]; //地址


        //小区地址属性中未必都包涵gps地址
        let _gpsp = '';


        if (dblk[1].children.length > 1) {
            _gpsp = dblk[1].children[1].attribs['value'].split('?')[1];
        }//地理坐标


        let _tags = []; //标签亮点
        dblk = esf.find('p.labeltag').find('span');

        for (let i = 0; i < dblk.length; i++) {
            let _tag = dblk[i].children[0].data;
            _tags.push(_tag);
        }


        dblk = esf.find('p.price-nub');
        let _tprice = Number(dblk.text().replace('万', ''));//

        dblk = esf.find('p.price-nub').siblings('p.f14');
        let rowUprice = dblk.text();
        // 总价，入库前需要用Number()转换型数值类型
        let _uprice = Number(rowUprice.replace('元/平', ''));//单价
        if (isNaN(_uprice)) {
            ut.showLog('单价原始数据[' + rowUprice + '], URL=[' + _url + ']');
        }


        //组合单条二手房信息结构，按照从微观到宏观的方式
        let esfInfo = {
            uprice: _uprice,    //单价，决定收益，要与小区均价、评估均价
            tprice: _tprice,    //总价，
            hrname: _hrname,    //小区名
            floor: _floor,      //楼层
            layout: _layout,    //户型
            drct: _drct,        //朝向
            zone: _zone,         //板块
            sdist: _dist,        //行政区
            tags: _tags,         //地铁距离、年限
            size: _size,         //面积
            bdyear: _bdyear,    //房屋建设年份
            title: _title,      //房源描述
            hrurl: gSiteUrl + _hrurl, //小区url
            url: gSiteUrl + _url,  //房源url
            cd: _today,       //当前日期
            ct: _nowtime, //时间戳
            ds: 'zy',  //数据源：中原
            gpsp: _gpsp,            //GPS坐标
            addr: _addr            //小区地址

        };

        // //根据房源的信息计算核定折扣，这个步骤也可以在采集数据后批量操作。
        // let cfmDisct = ut.getCfmDisct(esfInfo.size,esfInfo.floor,esfInfo.tprice,esfInfo.bdyear);
        // //将核定折价率合并到房源信息中。
        // esfInfo = Object.assign(esfInfo,cfmDisct);

        //将本条房源信息加入结果集
        //ut.showLog(JSON.stringify(esfInfo));
        results.push(esfInfo);
        if (records.length === results.length) {
            ut.showLog('本页所有记录已经处理完毕，调用数据处理函数，共' + records.length + '条数据。');
            dataProcessor(results);
        }

    });

    //检查是否有下一页，如果有'a.icons-righton'元素，则说明有下一页。
    let dblk = $('a.icons-righton');
    if (dblk.length !== 0) {
        nextPageUrl = dblk[0].attribs['href']; //下一页的url
    } else {
        nextPageUrl = '';
    }

    return nextPageUrl;
}


/**
 * 遍历二手房，计算每个房源的折扣率，并将esf信息入库
 * @param esfs
 */
function saveBsEsfFromHr(esfs) {

    let bsEsf = [];
    for (let i = 0; i < esfs.length; i++) {
        let esfInfo = esfs[i];
        //根据房源的信息计算核定折扣，这个步骤也可以在采集数据后批量操作。
        //let cfmDisct = ut.getCfmDisct(esfInfo.size,esfInfo.floor,esfInfo.tprice,esfInfo.bdyear);
        let cfmDisct = {aaa: 'aaa', bbb: 'bbb'};

        //将核定折价率合并到房源信息中。
        esfInfo = Object.assign(esfInfo, cfmDisct);
        bsEsf.push(esfInfo);
    }
    dbut.save2db('zyesf', bsEsf, cf.cDburl);//保存当前的一个小区信息到库中

}


/**
 * 采集某个版块内小区信息入库。
 * @param hrs
 */
function zoneDp4zy(hrs) {
    dbut.save2db('zyzone', hrs, cf.cDburl);
}

function esfDp4zy(esfs) {
    dbut.save2db('zyesf', esfs, cf.cDburl);
}

function export2xls(dburl, tbname) {

    let MongoClient = require('mongodb').MongoClient;
    MongoClient.connect(dburl, function (err, db) {

        ut.showLog('开始连接DB');
        selectData2(db, tbname, function (result) {

            //ut.showLog(JSON.stringify(result));
            let data_content = [];
            data_content.push(cf.cEsfFieldsName2);  //第一行是Excel表头，可以在这里手工定制


            ut.showLog('开始组装EXCEL数据' + result.length);
            for (let i = 0; i < result.length; i++) {
                let esf = result[i];
                ut.showLog(JSON.stringify(esf));

                //只导出笋值小于阀值的数据和存在异常的数据
                if (esf['bsr'] <= cf.bsrLessThen || isNaN(esf['bsr'])) {
                    //将每条房源的各个字段信息转换成数组，组装成一条房源记录
                    let arry = [];

                    //根据配置的列名顺序来组装导出每一条要导出的数据
                    let fieldNameList = Object.keys(cf.cEsfFields2);
                    for (let j = 1; j < fieldNameList.length; j++) {
                        let fieldName = fieldNameList[j];
                        if (fieldName === 'bsr') {
                            esf[fieldName] = esf[fieldName].toFixed(2);
                        }
                        arry.push(esf[fieldName]);
                    }
                    //将单条房源记录加入到所有记录中
                    data_content.push(arry);
                }

                if (i === result.length - 1) {
                    ut.exp2xls(data_content, cf.cExlExpPath, tbname + '-' + ut.getToday() );
                }
            }
            db.close(); //不关闭数据库，则有可能会导致进程一致不对出，挂起。

        });
    });
}

function selectData2(db, tbname, callback) {
    ut.showLog('开始查询将导出的数据');
    let collection = db.collection(tbname);
    collection.aggregate([
        {
            $match: {
                $and: [
                    {cd: ut.getToday()},
                    {hrap: {$gt: 0}} //只筛选出小区单价>0的二手房源，计算其笋度
                ]
            }
        },
        {$project: cf.cEsfFields2},
        {$sort: cf.cEsfSortBy2}
    ]).toArray(function (err, result) {
        if (err) {
            console.log('出错：' + err);
            return;
        }
        ut.showLog('完成查询' + result.length + '条');
        callback(result);
    });
}


/**
 * 设置二手房折扣信息
 * 将二手房信息转储到新的变量
 * 关闭二手房查询的数据库连接（否则在更新时会
 * 遍历被转储的二手房信息，对每套记录计算折扣率，并更新该条记录的折扣率。
 * @param esfs 被查询出来的二手房信息。
 * @param db
 */
function setEsfDisct(esfs, db) {
    //db.close();
    let assert = require('assert');

    //let esfDatas = [];
    // ut.showLog('开始转储二手房信息到esfDatas。')
    // for (let i = 0; i <= esfs.length - 1; i++) {
    //     esfDatas.push(esfs[i]);
    //     if (i === esfs.length - 1) {
    //         ut.showLog('已完二手房信息转储，关闭之前的数据库连接。');
    //         //db.close();
    //     }
    // }

    let MongoClient = require('mongodb').MongoClient;
    MongoClient.connect(cf.cDburl, function (err, db) {

        ut.showLog(esfs.length + '个二手房的折扣率信息将被设置');
        for (let i = 0; i < esfs.length; i++) {

            let esf = esfs[i];
            let _title = esf.title;
            let _url = esf.url;


            let _bdyear = esf.bdyear;
            if (!ut.isNumber(_bdyear))
                _bdyear = 9999;
            let disct = getDisctCfm4zy(esf.size, esf.tprice, _bdyear);


            ut.showLog(_title + '-折扣:' + JSON.stringify(disct));

            let col = db.collection('zyesf');
            col.updateMany(
                {'cd': {$eq: ut.getToday()}, 'url': {$eq: _url}},//当日小区的均价
                {$set: disct},
                function (err, r) {
                    assert.equal(err, null);
                    ut.showLog(_title + '-折扣:' + JSON.stringify(disct) + '-' + JSON.stringify(r));
                    //最后一条记录处理完毕后关闭连接
                    if (i === esfs.length - 1) {
                        ut.showLog('已完全部二手房折扣率计算，关闭数据库连接。');
                        db.close();
                    }
                });
        }
    });
}

function getDisctCfm4zy(size, tprice, bdyear) {

    let sizeDisct = getDisct4Size(size);
    let tpriceDisct = getDisct4Tprice(tprice);
    let bdyearDisct = getDisct4buildYear(bdyear);


    let cfmd = (sizeDisct.toFixed(2) * tpriceDisct.toFixed(2) * bdyearDisct.toFixed(2)).toFixed(3);
    cfmd = Math.round(cfmd * 100) / 100; //最低折扣

    // ut.showLog('面积折率:' + size + '平米->' + sizeDisct);
    // ut.showLog('总价折率:' + tprice + '元->' + tpriceDisct);
    // ut.showLog('年代折率:' + bdyear + '年->' + bdyearDisct);
    // ut.showLog('核定折率->' + cfmd);

    return {'sized': sizeDisct, 'tpriced': tpriceDisct, 'bdyeard': bdyearDisct, 'cfmd': cfmd};
}

/**
 * 根据面积维度计算折扣率
 * @param size
 * @returns 面积维度的折扣率，这个值
 */
function getDisct4Size(size) {

    let sizeDisct = 1;
    if (size > 150 && size <= 200) {
        sizeDisct = 0.9;
    } else if (size > 200) {
        sizeDisct = 0.8;
    }

    return sizeDisct;
}

/**
 * 根据楼层维度计算扣率
 * @param floorType
 * @returns {{floord: number}}
 */
function getDisct4Floor(floorType) {

    let floorDisct = 1;  //默认的楼层折扣

    if ('高层低区' === floorType) {

        floorDisct = 0.85;

    } else if ('多层高区' === floorType || '多层低区' === floorType) {

        floorDisct = 0.9;
    }

    return floorDisct;

}

/**
 * 根据总价维度计算扣率
 * @param tprice
 * @returns {{tpriced: number}}
 */
function getDisct4Tprice(tprice) {

    let tpriceDisct = 1;
    if (tprice > 1000 && tprice <= 2000) {
        tpriceDisct = 0.9;
    } else if (tprice > 2000) {
        tpriceDisct = 0.8;
    }
    return tpriceDisct;

}

/**
 * 根据年限计算扣率
 * @param bdyear
 * @returns {{bdyeard: number}}
 */
function getDisct4buildYear(bdyear) {
    let bdyearDisct = 1;

    if (bdyear < 1990) {
        bdyearDisct = 0.9;
    } else if (bdyear < 1998) {
        bdyearDisct = 0.95;
    }
    return bdyearDisct;

}


/**
 * 为二手房信息设置小区均价，便于后续计算
 * @param hrs
 * @param db
 */
function setEsfAvgPrice(hrs, db) {

    let assert = require('assert');
    let today = ut.formatDate(new Date(), 'yyyyMMdd');

    ut.showLog('遍历' + hrs.length + '个小区，为小区内的二手房设置均价。');
    for (let i = 0; i <= hrs.length - 1; i++) {
        //console.log(hrs[i].hrname + ':' + hrs[i].uprice);

        let _hrname = hrs[i].hrname;
        let _hrurl = hrs[i].url;
        let _avgPrice = hrs[i].uprice;
        let col = db.collection('zyesf');

        col.updateMany(
            {'cd': {$eq: today}, 'hrurl': {$eq: _hrurl}},//当日小区的均价
            {$set: {'hrap': _avgPrice}},
            function (err, r) {
                assert.equal(err, null);
                ut.showLog(_hrname + '-内的房源hrap被更新:' + JSON.stringify(r));
            });

        //最后一条记录处理完毕后关闭连接
        if (i === hrs.length - 1) {
            ut.showLog('已完成全部小区的二手房hrap更新。');
            db.close();
        }
    }


}