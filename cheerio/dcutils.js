'use strict';
/**
 * 目标：遍历某类页面，每页数据解析完成后，立即对该页数据进行处理。
 * @param siteUrl:网站主页的URL，便于递归调用时传递参数。
 * @param pageUrl:页面的URL，当前页面请求完后要判断是否还有下一页
 * @param htmlPaser:html解析函数，返回下一个将被解析的页面的url。
 * @param dataProcessor:被htmlPaser调用，处理每一页被解析的数据，如保存到文件、保存到数据库、发送、启动另一个进程等。
 * @param maxPageAmt:config文件中设置的可采集的最大的页数，采集完maxPageAmt的页数后，将退出
 * 注意事项：
 * 1、在调用本函数前，应该设置process.setMaxListener()，否则默认在7次调用后，程序就会挂起。
 * 2、对不同类型的页面要实现htmlPaser函数，用来解析数据内容，以及下一页的url
 * 3、对不同类型的页面要实现dataProcessor函数，完成对数据的操作。
 * 4、要确保在浏览器中可以访问的url链接，才能作为参数传入。不同网站的url略有不同，以中原为例，url需要以/结尾。
 */
exports.dc = function (siteUrl, pageUrl, htmlPaser, dataProcessor, maxPageAmt) {
    cdc(siteUrl, pageUrl, htmlPaser, dataProcessor, maxPageAmt);
};

function cdc(siteUrl, pageUrl, htmlPaser, dataProcessor, maxPageAmt) {

    let options = {
        hostname: 'sh.centanet.com',
        port: 80, //端口号 https默认端口 443， http默认的端口号是80
        path: pageUrl,
        method: 'POST',
        headers: {
            "Connection": "keep-alive",
            "Content-Length": 118,//siteUrl.concat(pageUrl).length,
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36"
        }//伪造请求头
    };
    let ut = require('./utils.js');
    let http = require('http');
    let iconv = require('iconv-lite');
    let cf = require('./config.js');

    try {
        ut.showLog('开始请求' + siteUrl + pageUrl);

        http.get(siteUrl + pageUrl, function (res) {
            //let req = http.get(options, function (res) {

            //ut.showLog('请求应答' + res.statusCode + '-' + res.statusMessage);

            let chunks = [];
            res.on('data', function (data) {
                chunks.push(data);
            });

            res.on('end', function () {
                let decodedContent = iconv.decode(Buffer.concat(chunks), 'utf-8');

                //总采集页数减1
                maxPageAmt = maxPageAmt - 1;
                //ut.showLog('html内容' + decodedContent);

                //接收完本次请求后的全部html数据后解析数据和处理数据
                let nextPageUrl = htmlPaser(decodedContent, dataProcessor);
                if (nextPageUrl !== '' && maxPageAmt > 0) {
                    //ut.showLog('下一页url:' + nextPageUrl + ' 。剩余页数=' + maxPageAmt);


                    setTimeout(function () {
                        //此处采用函数递归调用，也可以考虑启动单独的进程调用。
                        cdc(siteUrl, nextPageUrl, htmlPaser, dataProcessor, maxPageAmt);
                    }, cf.cDcInterval);

                } else {
                    ut.showLog('没有下一页了，程序执行完毕，退出。');
                    //process.exit(0);
                }
            });

            res.on('error', function (e) {
                console.error(e.message);
                console.error('http error' + e.stack);
            });

            // req.write(siteUrl+pageUrl);
            // req.end();
            process.on('uncaughtException', function (e) {
                console.log(e.message);
            });
        });
    } catch (e) {
        console.error('url=[' + pageUrl + ']');
        console.error('exception=[' + e + ']');
    }
}
