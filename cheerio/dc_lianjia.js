'use strict';
let http = require('http');
let cheerio = require('cheerio');

//设置采集参数
let gSiteUrl = 'http://sh.lianjia.com';
let gInitUrl = gSiteUrl + '/ershoufang/lujiazui/s1';
let gCurrentUrl = gInitUrl; //当前页为初始页

let gNextPageUrl = '';  //下一页的url，根据该字段的值判断是否继续遍历下一页。
let cSleepTime = 2000; //前后两次http访问之间的间隔时间
let gCurrentPageNum = 1;//初始的页面参数
let gParsedData = [];//解析后的全部结果


//对第一页的解析
dc(gCurrentUrl);


function dc(url) {
    try {
        http.get(url, function (res) {
            let _htmlcontent = '';
            res.on('data', function (data) {
                _htmlcontent += data;
            });
            res.on('end', function () {
                console.log('==================正在解析第' + gCurrentPageNum++ + '页');
                //接收完全部数据后解析数据
                parseEsf(_htmlcontent);
                if ('' !== gNextPageUrl) {
                    setTimeout(function () {
                        dc(gNextPageUrl);
                    }, cSleepTime);
                }
            });
            res.on('error', function (e) {
                console.error(e.message);
            })
        });
    } catch (e) {
        console.error('gCurrentUrl=[' + currentUrl + ']');
        console.error('gCurrentPageNum=[' + gCurrentPageNum + ']');
        console.error('_htmlcontent=[' + _htmlcontent + ']');
        console.error('exception=[' + e + ']');
    }

}


/**
 * 解析链家二手房列表页信息
 * @param html
 */
function parseEsf(html) {
    let $ = cheerio.load(html);

    let esfs = $('div.info');//定位每条房源信息最内侧的元素<div class='info'>
    console.log(esfs.length);
    esfs.each(function () {
        let esf = $(this);


        let dblk = esf.find('a.text');
        let _title = dblk.text(); //标题
        let _url = dblk.attr('href');//url

        dblk = esf.find('.row1-text').text().split('|');
        let _layout = dblk[0].trim(); //房型
        let _size = dblk[1].trim(); //面积
        let _floor = dblk[2].trim(); //楼层
        let _direction = dblk[3]; //朝向
        if (undefined === _direction) {
            _direction = '[未填]';
        } else {
            _direction = _direction.trim();
        }

        let _tprice = esf.find('.total-price').text();//总价
        let _uprice = esf.find('.minor').text().trim();//单价


        let _tags = []; //标签亮点
        esf.find('span.c-prop-tag2').each(function () {
            let _tag = $(this);
            _tags.push(_tag.text());
        });

        //单条二手房信息
        let esfInfo = {
            title: _title,
            url: _url,
            layout: _layout,
            floor: _floor,
            direction: _direction,
            tprice: _tprice,
            uprice: _uprice,
            size:_size,
            tags: _tags
        };

        //将本条房源信息加入结果集
        gParsedData.push(esfInfo);
        console.log('解析第' + gParsedData.length + '条，内容为:' + JSON.stringify(esfInfo));
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
