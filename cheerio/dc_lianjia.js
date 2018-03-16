'use strict';
/**
 * 主程序编码规范：
 * 1、代码顺序：
 * （1）引入第三方模块
 * （2）引入配置文件和实用工具
 * （3）声明主程序中使用的常量变量，c开头
 * （4）声明主程序中使用的全局变量，g开头。变量名都不用技术语言，而用业务语言
 * （5）主程序入口函数
 * （6）被主程序入口函数调用的其它函数
 *
 * 回归测试案例：
 * 1、采集数据   ：dc_lianjia.js
 * 2、小区均价采集：dc_hrup.js
 * 3、计算房源笋度：mc_genbbs.js
 * 4、导出数据   ：export2xls.js
 * 5、自动发送   ：dc.sh
 */

let https = require('https');
let cheerio = require('cheerio');
let config = require('./config');
let ut = require('./utils');
let iconv = require('iconv-lite');

const cDburl = config.cDburl;
let MongoClient = require('mongodb').MongoClient
    , assert = require('assert');


//从配置文件中获取参数
let cSiteUrl = config.cSiteUrl;
let cInitUrl = cSiteUrl + config.cInitUrl; //访问链接，以特定板块为入口，查询版块内的房源单价升序查询，只查前60个单价最低的。//TODO：板块入口地址做成参数化文件。

const cDcInterval = config.cDcInterval;    //前后两次http访问之间的间隔时间，防止被反爬虫策略阻断。单位是毫秒。
const cMaxPageNum = config.cMaxPageNum;    //采集的记录的页数，该参数会影响单个进程的内存上限。todo：将该参数分成开发模式和生产模式配置

//全局变量，多个函数会操作该
let gCurrentUrl = cInitUrl; //当前页为初始页
let gNextPageUrl = '';      //"下一页"的url，根据该字段的值判断是否继续遍历下一页。
let gCurrentPageNum = 1;    //初始的页面序号为1
let gParsedData = [];       //解析后的全部结果
let totalPage =0;
let ghasMoreNew = true;     //默认情况下，有更多的新纪录

const cCurrentDate = ut.formatDate(new Date(), 'yyyyMMdd'); //当前日期，入库标准字段。

main();

/**
 * 主调函数：根据命令行指定的参数，采集特定板块、行政区的数据
 */
function main() {
    let args = process.argv.splice(2);

    //默认的监听器数量是10，监听器的数量超过10以上则会报错，因此，需要在这里将监听器的上线调整到更大。设置为与最大采集数据的页数相同
    process.setMaxListeners(config.cMaxListener);
    if (args.length < 1) {
        console.error('应指定板块或行政区拼音名作为参数，如node dc_lianjia.js pudongxinqu');
        //gCurrentUrl = 'https://sh.lianjia.com/ershoufang/c5011000012622/';
        //gCurrentUrl = 'https://cq.lianjia.com/ershoufang/fengtianlu/co32/';
        gCurrentUrl = cInitUrl;//测试专用
        dc();
    } else {
        console.error('开始采集:' + args[0]);
        gCurrentUrl = config.cSiteUrl + config.cUrlPrefix + args[0] + config.cUrlPostfix;
        console.log(gCurrentUrl);
        dc();
    }


}

/**
 * 二手房数据采集、入库
 */
function dc() {
    try {
        ut.showLog('开始请求第[' + (gCurrentPageNum) + ']页[' + gCurrentUrl + ']');
        https.get(gCurrentUrl, function (res) {

            // console.log('url=============',gCurrentUrl);
            // console.log('statusCode:', res.statusCode);
            // console.log('headers:', res.headers);

            let chunks = []; //使用数组类变量而不是字符串类字段，以免将unicode双字节截断。
            res.on('data', function (data) {
                chunks.push(data);
            });

            res.on('end', function () {

                //对html进行转码
                let decodedContent = iconv.decode(Buffer.concat(chunks), 'utf-8');


                //接收完全部数据后解析数据
                parseEsf2(decodedContent);

                //如果已经没有新上盘，则将下一页url设置为空，不继续翻页
                if(config.dcNewOnly && !ghasMoreNew)
                    gNextPageUrl='';

                //如果下一页的url有内容，且当前页码小于最大页码，则继续采集下一页
                if ('' !== gNextPageUrl && gCurrentPageNum <= cMaxPageNum) {
                    setTimeout(function () {

                        gCurrentUrl = gNextPageUrl;
                        dc();
                    }, cDcInterval);
                } else {
                    ut.showLog('开始保存数到DB');
                    //达到最后一页则保存数据到数据

                    gParsedData.length > 1 ? save2db(gParsedData) : ut.showLog('收到解析的数据长度为0');
                }
            });

            res.on('error', function (e) {
                console.error(e.message);
                console.error('http error' + e.stack);
            });

            process.on('uncaughtException', function (e) {
                console.log(e);
            });
        });
    } catch (e) {
        console.error('gCurrentUrl=[' + gCurrentUrl + ']');
        console.error('gCurrentPageNum=[' + gCurrentPageNum + ']');
        console.error('exception=[' + e + ']');
        console.error(e);
    }
}


/**
 * 解析链家二手房列表页信息
 * @param html
 */
function parseEsf(html) {
    ut.showLog('正在解析第' + gCurrentPageNum + '页html');

    let $ = cheerio.load(html);
    let _nowtime = ut.formatDate(new Date(), 'hhmmss');

    let esfs = $('div.info');//定位每条房源信息最内侧的元素<div class='info'>
    esfs.each(function () {
        let esf = $(this);

        //以下代码按照界面中的信息块进行分段

        let dblk = esf.find('a.text');
        let _title = dblk.text(); //标题
        let _url = dblk.attr('href');//url

        dblk = esf.find('.row1-text').text().split('|');
        let _layout = dblk[0].trim(); //房型
        let _size = Number(dblk[1].trim().replace('平', '')); //面积
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
        let _bdyear = dblk[1].next.data.trim().replace('|', '');//建设年份

        let _tprice = Number(esf.find('.total-price').text());//总价，入库前需要用Number()转换型数值类型

        let rowUprice = esf.find('.minor').text().trim();
        let _uprice = Number(esf.find('.minor').text().trim().replace('单价', '').replace('元/平', ''));//单价
        if (isNaN(_uprice)) {
            ut.showLog('单价原始数据[' + rowUprice + ']房源单价[' + _uprice + '] , URL=[' + _url + ']');
            ut.showLog('转码后的数据[' + iconv.decode(rowUprice, 'gb2312') + ']');
        }


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
            zone: _zone,         //板块
            sdist: _dist,        //行政区
            tags: _tags,         //地铁距离、年限
            size: _size,         //面积
            bdyear: _bdyear,    //房屋建设年份
            title: _title,      //房源描述
            hrurl: cSiteUrl + _hrurl, //小区url
            url: cSiteUrl + _url,  //房源url
            cd: cCurrentDate,       //当前日期
            ct: _nowtime, //时间戳
            ds: 'lj'       //数据源：链家
        };

        //根据房源的信息计算核定折扣，这个步骤也可以在采集数据后批量操作。
        let cfmDisct = ut.getCfmDisct(esfInfo.size, esfInfo.floor, esfInfo.tprice, esfInfo.bdyear);
        //将核定折价率合并到房源信息中。
        esfInfo = Object.assign(esfInfo, cfmDisct);

        //将本条房源信息加入结果集
        gParsedData.push(esfInfo);
    });


    //如果最后一个翻页链接是“下一页”，则设置下一页的URL，为下次遍历做好参数准备
    //对要解析的内容有两种定位方法（1）通过关键字查找定位（2）通过遍历children子元素定位
    let lastPageLink = $('div.c-pagination').children().last();
    let lastPageTitle = lastPageLink.text().trim();
    if (lastPageTitle === '下一页') {
        gNextPageUrl = cSiteUrl + lastPageLink.attr('href');
        gCurrentPageNum++; //
    } else {
        gNextPageUrl = '';
    }

}

/**
 * 2018年2月LJ网站升级，根据升级后的网页版本解析数据。
 *
 * 【算法】
 * 以下代码按照界面中的数据块(datablock，简称dblk)进行分段解析。基本流程如下：
 *
 * 1、定位信息项（切记：在编写解析程序期间，一定要对http请求返回的数据，保存在html文件中，基于这个文件的结构来解析信息项。浏览器开发者工具中的html与http请求收到的未必相同
 *  (1)find定位，三种方式：find('.class值')、find('tag.class值')、find('tag名[指定属性名="指定属性值"]')如('div[data-role="ershoufang"]')
 *  (2)$定位如$('a',dblk)，这里dblk是$的结果
 *  (3)基于对象名定位；如在获取行政区名过程中，使用tmp['0']定位
 *
 * 2、取值
 *  (1)$('a', dblk).attr('href')：以$类型对象的attr()方法获取属性值。适合单条记录中信息的解析。
 *  (2)tmp['1'].children[0].data：以.方式获取属性值。适用于在一个列表中有个别特殊属性信息项的解析。如当前房源列表所在的行政区、板块等
 *  (3)tmp['1'].attribs.href：以.方式获取属性值。适用于在一个列表中有个别特殊属性信息项的解析。
 *  (4)dblk.text()：以text()方式获得tag之间的文字。适合单条记录中信息的解析。
 *
 * 3、拆分(若有)。有时多个信息项在一个字符串中，需要对信息项拆分。
 *
 * 4、类型转换。将需要计算的信息项转换成Number类型。
 *
 * 5、设置值。将被解析出的信息项存入数据对象，并push到带保存入库的数组中。
 *
 * @param html：hml文本
 */
function parseEsf2(html) {

    ut.wf('content.html',html);
    let _nowtime = ut.formatDate(new Date(), 'hhmmss');

    ut.showLog('正在解析第：' + gCurrentPageNum + '/'+totalPage+'页');

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

    //板块信息，在每条记录中解析获得
    // let _zone = tmp['1'].children[0].data;  //板块URL
    // let _zone_url = tmp['1'].attribs.href;  //板块名

    //基于上级节点(.sellListContent)定位列表中的每一条记录的节点，在遍历每条记录的过程中解析数据，生成数组
    let lc = $('li.clear', '.sellListContent');
    lc.each(function () {
        let esf = $(this);  //每条记录
        let tmp = '';       //用来临时保存从dblk解析出的包含多个信息项的临时变量


        let dblk = esf.find('.title');
        let _title = dblk.text(); //标题
        let _url = $('a', dblk).attr('href');//url

        let _isNew = $('span.new.tagBlock', dblk).text();
        _isNew = (_isNew==='新上') ? _isNew:'';


        //如果配置文件中约定只采集新盘，当前记录不是新上，则退出。
        if(config.dcNewOnly && _isNew!=='新上'){
            ghasMoreNew = false;
            return;
        }

        let _type = '';
        let _layout = '';
        let startIndex= 1;
        dblk = esf.find('.houseInfo');
        tmp = dblk.text().split('|');

        //别墅房型的信息列：复地太阳城 | 联排别墅 | 4室3厅 | 179.74平米 | 南 | 简装 | 无电梯
        if(tmp[startIndex].trim().indexOf('别墅')>=0){
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


        if(_layout.indexOf('别墅')>=0){
            _floor = pt1.substring(0,pt1.indexOf('层')+1);
            if(pt1.indexOf('年建')>=0){
                _bdyear = pt1.substring(pt1.indexOf('层') + 1, pt1.indexOf('年建'));
                _type = pt1.substring(pt1.indexOf('建') + 1);
            }else{
                _type = pt1.substring(pt1.indexOf('层')+1);
            }
        }else{
            _floor = pt1.substring(0, pt1.indexOf(')') + 1); //楼层
            if(pt1.indexOf('年建')>=0){
                _bdyear = pt1.substring(pt1.indexOf(')') + 1, pt1.indexOf('年建'));
                _type = pt1.substring(pt1.indexOf('建') + 1);
            }else{
                _type = pt1.substring(pt1.indexOf(')')+1);
            }
        }



        let _zone = tmp[1].trim();
        let _zoneurl = $('a',dblk).attr('href');


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

        //todo：验证是否其他属性也可以按照“行政区”和“板块”值的采集模式。减少对dom的查找操作，提升效率。

        //组合单条二手房信息结构，按照从微观到宏观的方式
        let esfInfo = {
            uprice: _uprice,    //单价，决定收益，要与小区均价、评估均价
            tprice: _tprice,    //总价，
            hrname: _hrname,    //小区名
            favamt: _favAmt,    //关注人数
            seeamt: _seeAmt,    //带看次数
            asktime:_askTime,   //挂牌时间
            deco:   _deco,      //装修
            floor: _floor,      //楼层
            layout: _layout,    //户型
            drct: _drct,        //朝向
            elvt: _elvt,        //电梯
            isnew:_isNew,       //是否为新楼盘
            type: _type,        //建筑类别
            zone: _zone,         //板块
            sdist: _dist,        //行政区
            disturl:_disturl,   //行政区url
            tags: _tags,         //地铁距离、年限
            size: _size,         //面积
            bdyear: _bdyear,    //房屋建设年份
            title: _title,      //房源描述
            hrurl: _hrurl, //小区url
            url: _url,  //房源url
            cd: cCurrentDate,       //当前日期
            ct: _nowtime, //时间戳
            ds: 'lj'       //数据源：链家
        };

        //根据房源的信息计算核定折扣，这个步骤也可以在采集数据后批量操作。
        let cfmDisct = ut.getCfmDisct2(esfInfo.size, esfInfo.floor, esfInfo.tprice, esfInfo.bdyear);
        //将核定折价率合并到房源信息中。
        esfInfo = Object.assign(esfInfo, cfmDisct);

        //将本条房源信息加入结果集
        gParsedData.push(esfInfo);
    });

    //如果最后一个翻页链接是“下一页”，则设置下一页的URL，为下次遍历做好参数准备
    let dblk = $('.house-lst-page-box');
    try {
        let pageInfo = JSON.parse(dblk.attr('page-data'));//翻页信息
        totalPage = Number(pageInfo.totalPage);
        let curPage = Number(pageInfo.curPage);
        if(curPage<totalPage){
            let nextPageUrl = dblk.attr('page-url');
            gNextPageUrl = config.cSiteUrl+nextPageUrl.replace('{page}',curPage+1);
            gCurrentPageNum++;
        }else{
            gNextPageUrl = '';
        }
    }catch(e){
        console.log('翻页信息解析错误',e,dblk,gCurrentUrl);
        ut.wf(ut.getToday()+'-'+ut.getNow()+'.html',JSON.stringify(e)+'\n'+html);       //dc.sh中，应在程序结束前将.html移动到log目录中
        //process.exit(0);
    }
    let a='1';//调试锚点，在此终端，便于观察上述变量的值

}

function save2db() {
    ut.showLog('开始数据入库');
    MongoClient.connect(cDburl, function (err, db) {
        assert.equal(null, err);    //assert.equal(actual, expected, [message])，当actual和expected不相等时才输出message

        let circm = {
            tbnm: 'esf',
            sel: {'username': 1, 'name': 1, 'email': 1, '_id': 0},
            where: {name: /a/},
            insertdt: gParsedData,
            updatedt: {$set: {email: ''}},
            deletedt: {name: /a/}
        };

        let coll = db.collection(circm.tbnm);
        coll.insertMany(circm.insertdt, function (err, result) {
            assert.equal(err, null);
            assert.equal(circm.insertdt.length, result.result.n); //result包括了result的document
            assert.equal(circm.insertdt.length, result.ops.length); //ops是包括了_id的document
            ut.showLog('完成保存房源到DB: ' + circm.tbnm + ' 共' + result.result.n + '条。');
            //callback(result); //todo:确认callback函数的用法
            db.close();
        });

    });
}

