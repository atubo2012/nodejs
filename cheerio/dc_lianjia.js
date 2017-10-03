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

let http = require('http');
let cheerio = require('cheerio');
let config = require('./config');
let ut  = require('./utils');
let iconv = require('iconv-lite');

const cDburl = config.cDburl;
let MongoClient = require('mongodb').MongoClient
    ,assert = require('assert');




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

const cCurrentDate = ut.formatDate(new Date(),'yyyyMMdd'); //当前日期，入库标准字段。

main();

/**
 * 主调函数：根据命令行指定的参数，采集特定板块、行政区的数据
 */
function main (){
    let args = process.argv.splice(2);

    //默认的监听器数量是10，监听器的数量超过10以上则会报错，因此，需要在这里将监听器的上线调整到更大。设置为与最大采集数据的页数相同
    process.setMaxListeners(config.cMaxListener);
    if(args.length<1){
        console.error('应指定板块或行政区拼音名作为参数，如node dc_lianjia.js pudongxinqu');
    }else{
        console.error('开始采集:'+args[0]);
        gCurrentUrl = config.cSiteUrl+config.cUrlPrefix+args[0]+config.cUrlPostfix;
        console.log(gCurrentUrl);
        dc();
    }
}

/**
 * 二手房数据采集、入库
 */
function dc() {
    try {
        ut.showLog('开始请求第[' + (gCurrentPageNum) +']页['+gCurrentUrl+']');
        http.get(gCurrentUrl, function (res) {

            let chunks = []; //使用数组类变量而不是字符串类字段，以免将unicode双字节截断。
            res.on('data', function (data) {
                chunks.push(data);
            });

            res.on('end', function () {

                //对html进行转码
                let decodedContent = iconv.decode(Buffer.concat(chunks),'utf-8');

                //接收完全部数据后解析数据
                parseEsf(decodedContent);

                if ('' !== gNextPageUrl && gCurrentPageNum<=cMaxPageNum) {
                    setTimeout(function () {

                        gCurrentUrl = gNextPageUrl;
                        dc();
                    }, cDcInterval);
                }else{
                    ut.showLog('开始保存数到DB');
                    //达到最后一页则保存数据到数据
                    save2db(gParsedData);
                }
            });

            res.on('error', function (e) {
                console.error(e.message);
                console.error('http error'+e.stack);
            });

            process.on('uncaughtException', function(e) {
                console.log(e);
            });
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
    ut.showLog('正在解析第' + gCurrentPageNum + '页html');

    let $ = cheerio.load(html);
    let _nowtime = ut.formatDate(new Date(),'hhmmss');

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
        let _bdyear = dblk[1].next.data.trim().replace('|','');//建设年份

        let _tprice = Number(esf.find('.total-price').text());//总价，入库前需要用Number()转换型数值类型

        let rowUprice = esf.find('.minor').text().trim();
        let _uprice = Number(esf.find('.minor').text().trim().replace('单价','').replace('元/平',''));//单价
        if(isNaN(_uprice))
        {
            ut.showLog('单价原始数据['+rowUprice+']房源单价['+_uprice+'] , URL=['+_url+']');
            ut.showLog('转码后的数据['+iconv.decode(rowUprice,'gb2312')+']');
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
            zone:_zone,         //板块
            sdist:_dist,        //行政区
            tags: _tags,         //地铁距离、年限
            size:_size,         //面积
            bdyear: _bdyear,    //房屋建设年份
            title: _title,      //房源描述
            hrurl:cSiteUrl+_hrurl, //小区url
            url: cSiteUrl+_url   ,  //房源url
            cd: cCurrentDate,       //当前日期
            ct: _nowtime, //时间戳
            ds:'lj'       //数据源：链家
        };

        //根据房源的信息计算核定折扣，这个步骤也可以在采集数据后批量操作。
        let cfmDisct = ut.getCfmDisct(esfInfo.size,esfInfo.floor,esfInfo.tprice,esfInfo.bdyear);
        //将核定折价率合并到房源信息中。
        esfInfo = Object.assign(esfInfo,cfmDisct);

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

function save2db() {
    ut.showLog('开始数据入库');
    MongoClient.connect(cDburl,function (err,db) {
        assert.equal(null, err);    //assert.equal(actual, expected, [message])，当actual和expected不相等时才输出message

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
            ut.showLog('完成保存房源到DB: ' + circm.tbnm+' 共'+result.result.n+'条。');
            //callback(result); //todo:确认callback函数的用法
            db.close();
        });

    });
}

