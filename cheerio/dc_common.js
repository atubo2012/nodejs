'use strict';

let cheerio = require('cheerio');
let ut = require('./utils.js');
let dbut = require('./dbutils.js');
let cf = require('./config.js');
let dc = require('./dcutils.js');
const cCurrentDate = ut.formatDate(new Date(), 'yyyyMMdd');
const gCmd = 'node dc_common.js ';

let gCity = 'sh';
let gDsName = 'lj' + gCity;
let gSiteUrl = 'https://{}.lianjia.com';
let gZone = 'taopu';    //debug模式下时使用的默认板块

let gCurrentPageNum = 0;    //当前的页数
let gNextPageUrl = '';      //下一页的链接
let gTotalPage = 0;         //总页数，在每一页中都要解析总页数，并更新该变量，在日志中显示进度。
//let ghasMoreNew = true;     //是否仍有更多“新上”记录，配合config.dcNewOnly=true时使用。

let gCurrentZones = [];     //当前被采集的板块列表，板块采集完后将被作为元素，被加入到gDistricts数组中某个元素成为属性
let gDistricts = [];        //城市的行政区列表和区内的板块列表
let gPostConds = cf.iclParkInfo ? '' : 'ng1/';  //根据参数来控制是否包含车位


main();

function main() {

    try {
        process.setMaxListeners(cf.cMaxListener);

        //截取出应用程序的参数。process.argv的前两个元素为：args[0]:node，args[1]:程序文件.js
        let args = process.argv.splice(2);
        let _instruct = args[0];

        if (args.length < 2) {
            console.error('应指定指令名参数，如：node dc_common.js dczone sh.taopu');
        } else {
            //解析城市和板块参数
            let cityAndZone = args[1].split('.');
            gCity = cityAndZone[0]; //区分不同的城市、库表名
            gZone = cityAndZone[1]; //区分不同的板块

            //根据运行时的参数，设置url和数据库名
            gSiteUrl = gSiteUrl.replace('{}', gCity);
            gDsName = 'lj' + gCity;


            console.log(gCity, gZone);

            if ('dchr' === _instruct) {
                if (gZone === undefined) {
                    ut.showLog('未指定板块名，应指定板块名！');
                } else {
                    ut.showLog('开始采集小区......');
                    dc.dcs(gSiteUrl, '/xiaoqu/' + gZone + '/', hrPaser, hrDp, cf.cMaxPageNum);
                }

            } else if ('dcesf' === _instruct) {
                if (gZone === undefined) {
                    ut.showLog('未指定板块名，应指定板块名！');
                } else {
                    ut.showLog('开始采集二手房......');
                    dc.dcs(gSiteUrl, '/ershoufang/' + gZone + '/co32' + gPostConds, esfPaser, esfDp, cf.cMaxPageNum);
                }

            } else if ('getdist' === _instruct) {
                ut.showLog('开始解析和生成板块信息......');
                ///ershoufang/ <-不含板块的名字，只找第一个<div>来定位行政区链接列表
                dc.dcs(gSiteUrl, '/ershoufang/', distPaser, dcZones, cf.cMaxPageNum);

            } else if ('setap' === _instruct) {
                ut.showLog('开始设置二手房的均价......');
                dbut.findFromDb(gDsName + 'zone', {cd: ut.getToday()}, cf.cMaxRcd, cf.cDburl, setEsfAvgPrice);

            } else if ('mccfmd' === _instruct) {

                ut.showLog('开始计算二手房的折扣率......');
                dbut.findFromDb(gDsName + 'esf', {cd: ut.getToday()}, cf.cMaxRcd, cf.cDburl, setEsfDisct);

            } else if ('expdata' === _instruct) {
                ut.showLog('开始导出数据......');
                export2xls(cf.cDburl, gDsName + 'esf');

            } else {
                ut.showLog(_instruct + '不是合法的指令，合法的指令包括：dczone|dcesf|setap|mccmfd|expdata');
            }
        }
    } catch (e) {
        console.error('gCurrentUrl=[' + gCurrentUrl + ']');
        console.error('gCurrentPageNum=[' + gCurrentPageNum + ']');
        console.error('exception=[' + e + ']');
        console.error(e);
    }
    /**
     * 以下代码用于开发调试时使用，在使用webstorme的debug功能时则不需要使用以下代码。
     */
    //采集板块内的小区信息
    //dc.dcs(gSiteUrl, '/xiaoqu/'+gZone+'/' , zonePaser, zoneDp,cf.cMaxPageNum);
    //采集版块内二手房信息
    //dc.dcs(gSiteUrl,'/ershoufang/'+gZone+'/',esfPaser,esfDp,cf.cMaxPageNum);
    //查询各小区的均价数据，并设置小区内二手房的均价，以便下一步计算
    //dbut.findFromDb(gDsName+'gZone', {cd: ut.getToday()}, 5000, cf.cDburl, setEsfAvgPrice);
    //根据折扣率计算公式，计算二手房的折扣率
    //dbut.findFromDb(gDsName+'esf', {cd: ut.getToday()}, 50000, cf.cDburl, setEsfDisct);
    //导出
    //export2xls(cf.cDburl, gDsName+'esf');
}

/**
 * 行政区解析器
 * @param html
 * @param dataProcessor
 * @returns {string}
 */
function distPaser(html, dataProcessor) {

    ut.wf(gZone + 'dist.html', html);
    //加载页面内容
    let $ = cheerio.load(html);

    //解析行政区信息。定位【指定属性名、属性值(data-role="ershoufang")】的节点下的class=selected属性
    let districts = $('div.m-filter').find('.position').find('div[data-role="ershoufang"]').find('a');

    //组装行政区列表
    districts.each(function () {
        let d = $(this);  //每条记录
        let _link = d.attr('href');
        let _distName = d.text();
        gDistricts.push({'dn': _distName, 'url': _link});
    });

    dataProcessor(gDistricts);
    //遍历每个行政区，并采集区内的板块

    console.log('行政区信息', JSON.stringify(gDistricts));

    //行政区列表，只在一页内采集完，所以无需返回下一页的url
    return '';

}


/**
 * 递归采集各个行政区内的板块信息
 * 初始的地址为行政区gDistricts数组中的第一个元素的地址（即第一页）
 * 下一页来自于gDistricts数组中的逐个元素内包含的地址
 */
function dcZones() {
    dc.dcs(gSiteUrl, gDistricts[0].url, zonePaser, zoneDp, cf.cMaxPageNum);
}

function zonePaser(html, dataProcessor) {

    gCurrentZones = [];
    ut.wf('zones.html', html);

    //加载页面内容
    let $ = cheerio.load(html);
    //定位到板块的链接信息区div
    let zones = $('div.m-filter').find('.position').find('div[data-role="ershoufang"]').find('div')['1'];
    //定位所有的链接
    zones = $('a', zones);

    //解析url和板块名
    zones.each(function () {
        let z = $(this);  //每条记录

        //解析url和板块名称
        let _link = z.attr('href');
        let _zoneName = z.text();

        //解析过程中顺便生成板块采集的命令行脚本
        let cmdArea = gCity + '.' + _link.replace('\/ershoufang\/', '').replace('\/', '');
        let _dcHrcmd = gCmd + ' dchr ' + cmdArea;
        let _dcEsfcmd = gCmd + ' dcesf ' + cmdArea;
        gCurrentZones.push({'zn': _zoneName, 'url': _link, 'dchrcmd': _dcHrcmd, 'dcesfcmd': _dcEsfcmd});
    });

    //解析完成后，将数据以元素的方式加载到行政区数组中
    Object.assign(gDistricts[gCurrentPageNum], {'zones': gCurrentZones});


    //判断是否有下一页，如有则返回下一页的url
    gTotalPage = gDistricts.length;
    console.log((gCurrentPageNum + 1) + '/', gTotalPage);
    if (gCurrentPageNum < gTotalPage - 1) {
        gNextPageUrl = gDistricts[gCurrentPageNum + 1].url;
        gCurrentPageNum++;

    } else {
        gNextPageUrl = '';
        //已完成全部翻页操作，对数据保存到数据库
        dataProcessor(gDistricts);
    }

    //行政区的采集不是靠翻页，所以将下一页的url设置为''
    return gNextPageUrl;
}

function hrPaser(html, dataProcessor) {

    let nextPageUrl = '';
    let results = [];//对数据解析后的内容

    let $ = cheerio.load(html);
    let _nowtime = ut.formatDate(new Date(), 'hhmmss');


    let records = $('ul.listContent').children();
    records.each(function () {
        let zone = $(this);

        let dblk = zone.find('div.title').find('a');
        let _hrname = dblk.text(); //ut.showLog(_hrname);
        let _url = dblk.attr('href');

        dblk = zone.find('div.houseInfo');
        let sellAndRent = dblk.text();
        let _sellAmt = sellAndRent.split('|')[0].trim();
        let _rentAmt = sellAndRent.split('|')[1].trim();

        dblk = zone.find('div.positionInfo');
        let positonInfo = dblk.text().split('/');
        let ttt = positonInfo[0].trim();
        let _dist = ttt.split('\n')[0];
        let _zone = ttt.split('\n')[1].trim();
        let _bdyear = positonInfo[1].trim();


        dblk = zone.find('div.totalPrice').find('span'); //通过查找两个标签来定位属性。
        let _uprice = dblk.text(); //小区均价

        _uprice = ('暂无' === _uprice) ? 0 : Number(_uprice);


        dblk = zone.find('a.totalSellCount');
        let _saleAmt = dblk.find('span').text();
        let _esfUrl = dblk.attr('href');


        // let _esfAmt = '0套';
        // let _czfAmt = '0套';
        //
        // //每个小区的二手房和租房为0套的情况下，在页面上不显示相应的节点。
        // for (let i = 0; i < dblk.length; i++) {
        //     if ('二手房' === dblk[i].children[0].data.trim()) {
        //         _esfAmt = dblk[i].children[1].children[0].data.trim();
        //     } else if ('租房' === dblk[i].children[0].data.trim()) {
        //         _czfAmt = dblk[i].children[1].children[0].data.trim();
        //     }
        //
        // }

        let hrInfo = {
            hrname: _hrname,    //小区名
            url: _url,
            uprice: _uprice,    //均价
            sellamt: _sellAmt,  //已售数量
            rentamt: _rentAmt,  //在租数量
            saleamt: _saleAmt,   //在售数量
            dist: _dist,
            zone: _zone,         //板块
            bdyear: _bdyear,    //房屋建设年份
            esfurl: _esfUrl,    //
            cd: ut.getToday(),       //当前日期
            ct: _nowtime, //时间戳
            ds: gDsName
        };

        results.push(hrInfo);
    });

    //检查是否有下一页。
    let dblk = $('.house-lst-page-box');
    try {
        let pageInfo = JSON.parse(dblk.attr('page-data'));//翻页信息
        gTotalPage = Number(pageInfo.totalPage);
        let curPage = Number(pageInfo.curPage);
        console.log(curPage + '/' + gTotalPage);

        if (curPage < gTotalPage) {
            let temp = dblk.attr('page-url');
            nextPageUrl = temp.replace('{page}', curPage + 1);
            gCurrentPageNum++;
        } else {
            nextPageUrl = '';
        }
    } catch (e) {
        console.log('翻页信息解析错误', e, dblk);
        ut.wf(gZone + '-hrs-' + ut.getToday() + '-' + ut.getNow() + '.html', JSON.stringify(e) + '\n' + html);       //dc.sh中，应在程序结束前将.html移动到log目录中
        //process.exit(0);
    }
    let a = '1';//调试锚点，在此终端，便于观察上述变量的值

    // if (dblk.length !== 0) {
    //     nextPageUrl = dblk[0].attribs['href']; //下一页的url
    // } else {
    //     nextPageUrl = '';
    // }


    dataProcessor(results);//处理本页数据
    return nextPageUrl;


}

function esfPaser(html, dataProcessor) {


    let results = [];//对数据解析后的内容
    //ut.wf(gZone + '-esf-content.html', html);
    let _nowtime = ut.formatDate(new Date(), 'hhmmss');


    //加载页面内容
    let $ = cheerio.load(html);

    //定位指定class属性值的节点（仅用来测试和验证）
    let leftContent = $('.leftContent');
    let sellListContent = $('.sellListContent');


    //解析行政区与板块信息。定位【指定属性名、属性值(data-role="ershoufang")】的节点下的class=selected属性
    let tmp = $('div.m-filter').find('.position').find('div[data-role="ershoufang"]').find('.selected');

    //用对象名的方式访问找到的节点。下文中0就是对象的key
    let _dist = tmp['0'].children[0].data;  //行政区名
    let _disturl = tmp['0'].attribs.href;  //行政区URL

    //基于上级节点(.sellListContent)定位列表中的每一条记录的节点，在遍历每条记录的过程中解析数据，生成数组
    let lc = $('li.clear', '.sellListContent');
    lc.each(function () {
        let esf = $(this);  //每条记录
        let tmp = '';       //用来临时保存从dblk解析出的包含多个信息项的临时变量


        let dblk = esf.find('.title');
        let _title = dblk.text(); //标题
        let _url = $('a', dblk).attr('href');//url

        //是否新上
        let _isNew = $('span.new.tagBlock', dblk).text();
        _isNew = (_isNew === '新上') ? _isNew : '';


        let _type = '';
        let _layout = null;
        let startIndex = 1;
        dblk = esf.find('.houseInfo');
        tmp = dblk.text().split('|');
        //别墅房型的信息列：复地太阳城 | 联排别墅 | 4室3厅 | 179.74平米 | 南 | 简装 | 无电梯
        if (tmp[startIndex].trim().indexOf('别墅') >= 0) {
            _type = tmp[startIndex++].trim();
        }

        //非别墅房型的新系列：华松小区 | 2室1厅 | 59.6平米 | 南 | 简装 | 无电梯
        _layout = tmp[startIndex++].trim(); //房型
        let _size = Number(tmp[startIndex++].trim().replace('平米', '')); //面积
        let _drct = tmp[startIndex++]; //朝向，有可能为空
        if (undefined === _drct) {
            _drct = '[未填]';
        } else {
            _drct = _drct.trim();
        }
        let _deco = tmp[startIndex]; //装修

        let _elvt = '';     //电梯，有可能为空
        if (tmp.length < 6) {
            //console.log('数据项少于6 :'+tmp.length,tmp,_url);
        } else {
            _elvt = tmp[5];//电梯
        }


        dblk = esf.find('.houseInfo').find('a');
        let _hrname = dblk.text(); //小区名
        let _hrurl = dblk.attr('href'); //小区链接


        dblk = esf.find('.positionInfo');
        tmp = dblk.text().split('-');
        let pt1 = tmp[0].trim();

        let _floor = '';
        let _bdyear = '[未填]';


        if (_layout.indexOf('别墅') >= 0) {
            _floor = pt1.substring(0, pt1.indexOf('层') + 1);
            if (pt1.indexOf('年建') >= 0) {
                _bdyear = pt1.substring(pt1.indexOf('层') + 1, pt1.indexOf('年建'));
                _type = pt1.substring(pt1.indexOf('建') + 1);
            } else {
                _type = pt1.substring(pt1.indexOf('层') + 1);
            }
        } else {
            _floor = pt1.substring(0, pt1.indexOf(')') + 1); //楼层
            if (pt1.indexOf('年建') >= 0) {
                _bdyear = pt1.substring(pt1.indexOf(')') + 1, pt1.indexOf('年建'));
                _type = pt1.substring(pt1.indexOf('建') + 1);
            } else {
                _type = pt1.substring(pt1.indexOf(')') + 1);
            }
        }


        let _zone = tmp[1].trim();
        let _zoneurl = $('a', dblk).attr('href');


        dblk = esf.find('.followInfo');
        tmp = dblk.text().split('/');
        let _favAmt = Number(tmp[0].replace('人关注', '').trim());
        let _seeAmt = Number(tmp[1].replace('共', '').replace('次带看', '').trim());
        let _askTime = tmp[2].replace('以前发布', '');


        let _tags = [];
        dblk = esf.find('.tag').find('span');
        //dblk.length === 0 ? console.log('notag:',_url) : '';
        dblk.each(function () {
            let _tag = $(this);
            let key = _tag.attr('class');
            let value = _tag.text();
            let item = {};
            item[key] = value;
            _tags.push(item);
        });


        dblk = esf.find('.totalPrice').find('span');
        let _tprice = Number(dblk.text());


        dblk = esf.find('.unitPrice');
        let _rowUprice = dblk.attr('data-price');
        let _uprice = Number(_rowUprice);//单价


        //组合单条二手房信息结构，按照从微观到宏观的方式
        let esfInfo = {
            uprice: _uprice,    //单价，决定收益，要与小区均价、评估均价
            tprice: _tprice,    //总价，
            hrname: _hrname,    //小区名
            favamt: _favAmt,    //关注人数
            seeamt: _seeAmt,    //带看次数
            asktime: _askTime,   //挂牌时间
            deco: _deco,      //装修
            floor: _floor,      //楼层
            layout: _layout,    //户型
            drct: _drct,        //朝向
            elvt: _elvt,        //电梯
            isnew: _isNew,       //是否为新楼盘
            type: _type,        //建筑类别
            zone: _zone,         //板块
            sdist: _dist,        //行政区
            disturl: _disturl,   //行政区url
            tags: _tags,         //地铁距离、年限
            size: _size,         //面积
            bdyear: _bdyear,    //房屋建设年份
            title: _title,      //房源描述
            hrurl: _hrurl, //小区url
            url: _url,  //房源url
            cd: cCurrentDate,       //当前日期
            ct: _nowtime, //时间戳
            ds: gDsName       //数据源：链家
        };

        //根据房源的信息计算核定折扣，这个步骤也可以在采集数据后批量操作。
        let cfmDisct = ut.getCfmDisct2(esfInfo.size, esfInfo.floor, esfInfo.tprice, esfInfo.bdyear);
        //将核定折价率合并到房源信息中。
        esfInfo = Object.assign(esfInfo, cfmDisct);

        //将本条房源信息加入结果集
        results.push(esfInfo);
        if (lc.length === results.length) {
            //ut.showLog('本页已加载完');
            dataProcessor(results);
        }
    });

    //如果最后一个翻页链接是“下一页”，则设置下一页的URL，为下次遍历做好参数准备
    let dblk = $('.house-lst-page-box');
    try {
        let pageInfo = JSON.parse(dblk.attr('page-data'));//翻页信息
        gTotalPage = Number(pageInfo.totalPage);
        let curPage = Number(pageInfo.curPage);
        console.log(curPage + '/' + gTotalPage);
        if (curPage < gTotalPage) {
            let nextPageUrl = dblk.attr('page-url');
            gNextPageUrl = nextPageUrl.replace('{page}', curPage + 1);
            gCurrentPageNum++;
        } else {
            gNextPageUrl = '';
        }
    } catch (e) {
        console.log('翻页信息解析错误', e, dblk, gNextPageUrl);
        ut.wf(gZone + '-esf-' + ut.getToday() + '-' + ut.getNow() + '.html', JSON.stringify(e) + '\n' + html);       //dc.sh中，应在程序结束前将.html移动到log目录中
        setTimeout(function () {
            //此处采用函数递归调用，也可以考虑启动单独的进程调用。
            console.log('休息一会.....');
        }, 10000);

    }
    let a = '1';//调试锚点，在此终端，便于观察上述变量的值

    return gNextPageUrl;

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
    dbut.save2db(gDsName + 'esf', bsEsf, cf.cDburl);//保存当前的一个小区信息到库中

}


/**
 * 采集某个版块内小区信息入库。
 * @param hrs
 */
function hrDp(hrs) {
    dbut.save2db(gDsName + 'zone', hrs, cf.cDburl);
}

function esfDp(esfs) {
    dbut.save2db2(gDsName + 'esf', esfs, cf.cDburl);
}

/**
 * 将行政区、板块数据保存入库。并生成该城市所有板块的采集脚本。
 * @param districts
 */
function zoneDp(districts) {

    //将当前板块的数组添加到当前的行政区
    dbut.save2db2(gDsName + 'dist', districts, cf.cDburl);

    //生成采集该城市的命令行脚本文件的内容
    let totalDcTmies = 0;   //总采集量
    districts.map(function (item, index, arr) {
        totalDcTmies += item.zones.length * 2;//因为版块内的小区要采集一次、二手房要采集一次，一共两次
    });

    //生成脚本文件内容
    let distCmd = '';
    let dcTimes = 0;
    districts.map(function (item, index, arr) {

        if (cf.xclZones[gCity].indexOf(item.dn) < 0) {
            //跳过不需要采集的行政区
            item.zones.map(function (item1, index1, arr1) {
                //跳过不需要采集的板块
                if (cf.xclZones[gCity].indexOf(item1.zn) < 0) {
                    distCmd += item1.dchrcmd + ' \n';
                    dcTimes++;
                    distCmd += 'echo ' + dcTimes + ' \/' + totalDcTmies + ' \n';
                    distCmd += item1.dcesfcmd + ' \n';
                    dcTimes++;
                    distCmd += 'echo ' + dcTimes + ' \/' + totalDcTmies + ' \n';
                }
            });
        }
        distCmd += ' \n';
    });

    //在脚本文件的首部和尾部增加例行操作（如清理数据、建索引、计算、执行等）
    let _head = ut.rf('dchead.sh.tplt');
    let _foot = ut.rf('dcfoot.sh.tplt');

    //在文件系统中生成采集脚本
    ut.wf(gDsName + '.sh', (_head + distCmd + _foot).replace(/{city}/g, gCity));


    let a = 1;

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
                //ut.showLog(JSON.stringify(esf));

                //只导出笋值小于阀值的数据和存在异常的数据
                if (esf['bsr'] <= cf.bsrLessThen || isNaN(esf['bsr'])) {
                    //将每条房源的各个字段信息转换成数组，组装成一条房源记录
                    let arry = [];

                    //根据配置的列名顺序来组装导出每一条要导出的数据
                    let fieldNameList = Object.keys(cf.cEsfFields2);
                    for (let j = 1; j < fieldNameList.length; j++) {
                        let fieldName = fieldNameList[j];
                        //if (fieldName === 'bsr' && esf[fieldName]!== null) {
                        if (fieldName === 'bsr') {
                            if (esf[fieldName] === null) {
                                ut.showLog('以下笋度值未空，建议排查原因:');
                                ut.showLog(JSON.stringify(esf));
                            }
                            else {
                                esf[fieldName] = esf[fieldName].toFixed(2);
                            }
                        }
                        arry.push(esf[fieldName]);
                    }
                    //将单条房源记录加入到所有记录中
                    data_content.push(arry);
                }

                if (i === result.length - 1) {
                    ut.exp2xls(data_content, cf.cExlExpPath, tbname + '-' + ut.getToday());
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
            let _url = esf.url;

            let _bdyear = esf.bdyear;
            if (!ut.isNumber(_bdyear))
                _bdyear = 9999;
            let disct = getDisctCfm(esf.size, esf.tprice, _bdyear);

            let col = db.collection(gDsName + 'esf');
            col.updateMany(
                {'cd': {$eq: ut.getToday()}, 'url': {$eq: _url}},//当日小区的均价
                {$set: disct},
                function (err, r) {
                    assert.equal(err, null);
                    //console.log(_url,'-',r.result.nModified);

                    //最后一条记录处理完毕后关闭连接
                    if (i === esfs.length - 1) {
                        ut.showLog('已完全部二手房折扣率计算，关闭数据库连接。');
                        db.close();
                    }
                });
            //ut.showLog(esf.title + '-折扣率信息将被设置');
        }
    });
}

function getDisctCfm(size, tprice, bdyear) {

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

    let MongoClient = require('mongodb').MongoClient;
    MongoClient.connect(cf.cDburl, function (err, db) {
        ut.showLog('遍历' + hrs.length + '个小区，为小区内的二手房设置均价。');

        for (let i = 0; i <= hrs.length - 1; i++) {

            let _hrname = hrs[i].hrname;
            let _hrurl = hrs[i].url;
            let _avgPrice = hrs[i].uprice;

            let col = db.collection(gDsName + 'esf');
            col.updateMany(
                {'cd': {$eq: today}, 'hrurl': {$eq: _hrurl}},//当日小区的均价
                {$set: {'hrap': _avgPrice}},
                function (err, r) {
                    assert.equal(err, null);

                    //最后一条记录处理完毕后关闭连接
                    if (i === hrs.length - 1) {
                        ut.showLog('已完成全部小区的二手房hrap更新。');
                        db.close();
                    }
                    //ut.showLog(_hrname + '-hr:' + JSON.stringify(r));
                });


        }
    })


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
