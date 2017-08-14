let http = require('http');
let cheerio = require('cheerio');
let moocUrl = 'http://www.imooc.com/learn/348';

let gSiteUrl = 'http://sh.lianjia.com';
let gInitUrl = gSiteUrl + '/ershoufang/tianshan/s3'; //s3：按单价升序排列；l4l5s3：四房五房按单价升序排列。
let gTrPageNum = 4; //程序要遍历的页面数
let gNextPageUrl = '';//下一页的url，根据该字段的值判断是否继续遍历。


let gCurrentPageNum = 1;
let gCurrentUrl = gInitUrl;

//对第一页的解析
dc(gInitUrl);
//解析完成后，判断如果存在下一页的链接，则更新下一轮解析的url，否则跳出循环。
while ('' !== gNextPageUrl) {
    console.log('下一页的序号:' + (gCurrentPageNum + 1) + '-url=[' + gNextPageUrl + ']');
    gCurrentUrl = gNextPageUrl;
    dc(gCurrentUrl);
    if (gCurrentPageNum++ > gTrPageNum) {
        console.log('因下一页序号' + gCurrentPageNum + '已经超过已设定的遍历总数' + gTrPageNum + '，程序退出。');
    }
}



function dc(url) {
    try {
        http.get(url, function (res) {
            let _htmlcontent = '';
            res.on('data', function (data) {
                _htmlcontent += data;
            });
            res.on('end', function () {
                //接收完全部数据后解析数据
                parseEsf(_htmlcontent);
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
    let count = 0;
    esfs.each(function () {
        let esf = $(this);


        let dblk = esf.find('a.text');
        let _title = dblk.text(); //标题
        let _url = dblk.attr('href');//url

        dblk = esf.find('.row1-text').text().split('|');
        let _layout = dblk[0].trim(); //房型
        let _sq = dblk[1].trim(); //面积
        let _floor = dblk[2].trim(); //楼层
        let _direction = dblk[3]; //朝向
        if (undefined === _direction) {
            _direction = '[未填]';
        } else {
            _direction = _direction.trim();
        }

        let _tprice = esf.find('.total-price').text();//总价
        let _uprice = esf.find('.minor').text().trim();//单价


        let tags = []; //标签亮点
        esf.find('span.c-prop-tag2').each(function () {
            let _tag = $(this);
            tags.push(_tag.text());
        });

        console.log(++count + '==' + _title + '====' + tags);

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

}






/**
 * 根据url解析页面中的数据
 * @param url 需被解析的url
 */
function dataCollect(url) {

    try {
        http.get(url, function (res) {
            let htmlcontent = '';
            res.on('data', function (data) {
                htmlcontent += data;
            });

            res.on('end', function () {
                parseEsf(htmlcontent);
            });

            res.on('error', function (e) {
                console.error(e.message);
            })
        });
    } catch (e) {
        console.error("======================");
        console.error(e);
    }
}



/**
 * 网上一篇关于解析慕课网nodejs课程目录的例子。
 * @param html
 */
function parseMooc(html) {
    let $ = cheerio.load(html);

    let chapters = $('div.chapter');
    let courseData = [];

    chapters.each(function () {
        let chapter = $(this);
        let charTitle = chapter.find('strong').contents().filter(function () {
            return this.nodeType === 3;
        }).text().trim();

        console.log(charTitle);
    });
}


/**
 * 本函数是最初用来练手的，已不使用，特留作纪念。
 * @param html
 */
function callback(html) {
    let $ = cheerio.load(html);

    let esfs = $('a.text');
    let esfData = [];
    let count = 0;
    esfs.each(function () {
        let esf = $(this);
        let esfTitle = esf.text();
        let esfUrl = esf.attr('href');
        let esfInfo = esf.parent().siblings('.info-table').find('.row1-text').contents().text().trim().split('|');


        if (count == 1) {
            console.log(esfTitle);
            console.log(esfUrl);
            console.log('[' + esfInfo[0].trim() + ']');
            console.log('[' + esfInfo[1].trim() + ']');
            console.log('[' + esfInfo[2].trim() + ']');
            console.log('[' + esfInfo[3].trim() + ']');
        }
        count++;

    });

}
