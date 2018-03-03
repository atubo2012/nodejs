'use strict';

/**
 * TOOLKIT，用来学习验证js的语言特性。
 * 新功能先通过本文件验证，具有通用性的代码，将迁移到xxutil.js中用于生产环境
 */


let cf = require('./config');
let ut = require('./utils');
let dbut = require('./dbutils');
let dcut = require('./dcutils');

let http = require('http');
let cheerio = require('cheerio');
let iconv = require('iconv-lite');
let today = ut.formatDate(new Date(), 'yyyyMMdd');

let fs = require('fs');


/**
 <ul id="fruits">
    <li class="apple">Apple</li>
    <li class="orange">Orange</li>
    <li class="pear">Pear</li>
 </ul>
 */
function cheerioTest(){
    let html=fs.readFileSync('cheeriotest.html').toString();
    let $ = cheerio.load(html);
    let a1 = $('.apple','#fruits').text();
    let a2 = $('ul .pear').attr('class');
    let a3 = $('li[class=orange]').html();

    let html2=fs.readFileSync('t-lianjia.html').toString();
    $ = cheerio.load(html2);

    let a4 = $('.apple','#aa').text();
    let a5 = $();

    console.log('aaaa')


}

cheerioTest();


/**
 * 测试https协议获取数据
 * @param url
 */
function httpstest(url) {
    const https = require('https');
    let chunks = []; //使用数组类变量而不是字符串类字段，以免将unicode双字节截断。

    https.get(url, (res) => {
        console.log('statusCode:', res.statusCode);
        console.log('headers:', res.headers);
        res.on('data', function (data) {
            chunks.push(data);
        });
        res.on('end', function () {
            console.log('chunks-decoded',iconv.decode(Buffer.concat(chunks),'utf-8'));
        });

        res.on('error', function (e) {
            console.error(e.message);
            console.error('http error' + e.stack);
        });

        process.on('uncaughtException', function (e) {
            console.log(e);
        });
    });

}
//httpstest('https://www.baidu.com');

/**
 * 测试入口函数
 */
//main();

/**
 * 住测试函数，所有的测试类函数都通过main函数调用来测试
 */
function main() {
    //console.log(ut.formatDate(new Date(),'hhmmss'));
    //console.log(ut.getToday()+'-'+ut.getNow());

    //console.log(require('./utils').getCfmDisct(156,'低区/22层',580,'1986年建'));
    //mathTest();
    // isNumber('asdf');
    // isNumber('3.2');
    // isNumber('0.192912');
    // isNumber('a1a.');
    // isNumber('32033');
    // isNumber('0.12.1');

    //object2array();
    //saveHrAvgPrice();
    //strTest();
    //cmdArgs();
    //ut.showLog('哈哈哈你好');


    // let aaa  = [{aa:'aaa'},{bb:'bbb'}];
    //dbut.save2db('zyesf',aaa,cf.cDburl);

    //dbut.findFromDb('userc', {}, 1000, cf.cDburl, console.log);

    //bulkTest();



    //对一个zone中所有的小区内的最多50个房源进行遍历，保存响应的二手房信息
    //cdc('http://sh.centanet.com', '/xiaoqu/linping/' , zonePaser4zy, getBsEsfFromZone4zy,1);

    process.setMaxListeners(1000);
    //dcut.cdc('http://sh.centanet.com', '/xiaoqu/beiwaitan/' , zonePaser4zy, zoneDp4zy,20);
    //cdc('http://sh.centanet.com','/ershoufang/beiwaitan/',esfPaser4zy,esfDp4zy,20);




    //查询各小区的均价数据，并设置小区内二手房的均价，以便下一步计算
    //dbut.findFromDb('zyzone', {cd: today}, 1000, cf.cDburl, setEsfAvgPrice);

    //根据折扣率计算公式，计算二手房的折扣率
    //dbut.findFromDb('zyesf', {cd: today}, 1000, cf.cDburl, setEsfDisct);

    //导出excel
    //export2xls(cf.cDburl,'zyesf');



    //ut.showLog(JSON.stringify(getDisctCfm4zy(450,1200,1955)));

    //dbut.findFromDb('esf', {cd: today}, 1000, cf.cDburl, getEsfDetail);

    dcut.dc('http://sh.lianjia.com','/ershoufang/sh4549676.html',psEsfDetail,getEsfDetail,1);

}

function psEsfDetail(html, dataProcessor) {
    let $ = cheerio.load(html);
    let dblk = $('look-list');

    let seeTimes = dblk[0].attribs['count90'];
    return "";
    dataProcessor(aaa);
}

function getEsfDetail(esfDetail) {
    console.log(esfDetail);
}




function bulkTest2() {
    let MongoClient = require('mongodb').MongoClient
        , assert = require('assert');

// Connection URL
    let url = 'mongodb://100td:27117/test';
// Use connect method to connect to the Server
    MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        console.log("Connected correctly to server");

        let colZone = db.collection('zyzone');
        // Create ordered bulk, for unordered initializeUnorderedBulkOp()
        let bulkZone = colZone.initializeOrderedBulkOp();
        // Insert 10 documents
        for (let i = 0; i < 10; i++) {
            bulk.insert({a: i});
        }

        // Next perform some upserts
        for (let i = 0; i < 10; i++) {
            bulk.find({b: i}).upsert().updateOne({b: 1});
        }

        // Finally perform a remove operation
        bulk.find({b: 1}).deleteOne();

        // Execute the bulk with a journal write concern
        bulk.execute(function (err, result) {
            assert.equal(null, err);
            db.close();
        });
    });
}

function bulkTest() {
    let MongoClient = require('mongodb').MongoClient
        , assert = require('assert');

// Connection URL
    let url = 'mongodb://100td:27117/test';
// Use connect method to connect to the Server
    MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        console.log("Connected correctly to server");

        let col = db.collection('bulkops');
        // Create ordered bulk, for unordered initializeUnorderedBulkOp()
        let bulk = col.initializeOrderedBulkOp();
        // Insert 10 documents
        for (let i = 0; i < 10; i++) {
            bulk.insert({a: i});
        }

        // Next perform some upserts
        for (let i = 0; i < 10; i++) {
            bulk.find({b: i}).upsert().updateOne({b: 1});
        }

        // Finally perform a remove operation
        bulk.find({b: 1}).deleteOne();

        // Execute the bulk with a journal write concern
        bulk.execute(function (err, result) {
            assert.equal(null, err);
            db.close();
        });
    });
}




/**
 * 测试命令行参数
 * @type {Array.<*>}
 */
function cmdArgs() {
    let args = process.argv.splice(2);
    console.log(args);
    console.log(process.argv);
    if (args.length < 1) {
        console.error('应至少包含一个参数');
    } else {

        console.error('目前的参数是' + args.length);
    }
}


/**
 * 串行执行函数
 */
function asynTest() {
    let methodArray = [];

    function m1() {
        console.log('m1');
        next();
    }

    function m2() {
        console.log('m2');
        next();
    }

    function m3() {
        console.log('m3');
        next();
    }

    function addMethod(m) {
        methodArray.push(m);
    }

    function next() {
        if (methodArray.length > 0) {
            methodArray.shift()();

        }
    }

    addMethod(m2);
    addMethod(m1);
    addMethod(m3);
    next();

}

/**
 * 字符串操作测试集
 */
function strTest() {
    let a = cf.cInitUrl;

    //根据字符串中的分隔符拆分成数组
    let f = a.split('/');//将某个字符为分隔符，拆分成数组。
    console.log(f);

    //替换字符串中的字符
    let b = '单价784元/平米';
    console.log(b.replace('单价', '').replace('元/平米', ''));

}

/**
 * 取整、四舍五入、取随机数
 */
function mathTest() {

    let n = 3.45333;
    //随机数类
    console.log('取随机数=' + Math.random()); //返回0和1间(包括0,不包括1)的一个随机数。

    //从第3位小数开始，四舍五入，保留两位小数。
    console.log(n + '四舍五入保留2位小数=' + Math.round(n * 100) / 100);

    //保留3位小数
    console.log(n + '保留3位小数=' + n.toFixed(3));

    //四舍五入类
    console.log(n + '四舍五入后的整数=' + Math.round(n)); //返回n四舍五入后整数的值。
    console.log('取0或1随机数=' + Math.round(Math.random())); //可均衡获取0到1的随机整数。
    console.log('0-10内随机整数=' + Math.round(Math.random() * 10)); //获取0到10的随机整数，其中获取最小值0和最大值10的几率少一半。

    //向大取整类
    console.log(n + '向大整数=' + Math.ceil(n)); // 返回大于等于n的最小整数。
    console.log('1-10内随机整数=' + Math.ceil(Math.random() * 10)); //取1到10的随机整数，取0的几率极小。

    //向小取整
    console.log(n + '向小整数=' + Math.floor(n)); //返回小于等于n的最大整数。
    console.log('9以内取整=' + Math.floor(Math.random() * 10)); //，可均衡获取0到9的随机整数。
}


/**
 * 将对象的value转换成数组
 * 如果要将key转换成数组，就push(item)
 */
function object2array() {
    let obj = {'a': 'A', 'b': 'B'};
    let arr = [];

    for (let item in obj) {
        arr.push(obj[item]);
    }
    console.log(arr);

}

/**
 * 日期格式测试
 * @type {Date}
 * ================================
 *  */
function dateTest() {
    let d = new Date();
    let today = d.getFullYear() + '-' + d.getMonth() + 1 + '-' + d.getDate();
    let t2 = d.getDate();
    console.log(today);
    console.log(d.toLocaleDateString());
    console.log(new Date().toLocaleTimeString());

}

/**
 * 从数据库中读取数据，并写成excel格式的文件
 */
function export2xlsTest() {
    //let DB_CONN_STR = 'mongodb://demo:demo123@192.168.2.2:27017/traincenter';  //数据库连接字符串，带密码
    let DB_CONN_STR = 'mongodb://100td:27117/test';
    let xlsx = require('node-xlsx');
    let fs = require('fs');

    let MongoClient = require('mongodb').MongoClient;
    MongoClient.connect(DB_CONN_STR, function (err, db) {
        console.log('连接成功');
        selectData(db, function (result) {
            let data_content = [
                ['单价', '总价', '小区名']
            ];  //JSON数组，第一行是Excel表头
            for (let i = 0; i < result.length; i++) {
                let arry = [
                    result[i].uprice,
                    result[i].tprice,
                    result[i].hrname//,
                    //formatDate(result[i].create_time, 'yyyy-MM-dd hh:mm:ss')
                ];
                console.log(arry);
                data_content.push(arry);
                // 将读取的所需列加入到JSON数组，其中的ccl_trade_id（交易单号）的数据类型是长整型，不知道怎么转换，索性就加了引号，成字符串了
            }

            db.close();  // 关闭数据库连接

            let file = xlsx.build([{
                name: 'mySheetName',
                data: data_content
            }]);   //构建xlsx对象
            fs.writeFileSync('C:/Users/x1/Desktop/data.xlsx', file, 'binary'); // 写入
            console.log('文件写入完成');
        });
    });

    let selectData = function (db, callback) {
        let collection = db.collection('esf'); //哪个表
        collection.find().limit(60).skip(0).toArray(function (err, result) {  //读取60条数据
            if (err) {
                console.log('出错：' + err);
                return;
            }
            callback(result);
        });
    };
}

/**
 * nodemailer发送邮件
 **/
function sendMailTest() {
    let nodemailer = require('nodemailer');
    let mailOptions = {
        from: 'ybt2016@126.com', // 发件地址
        to: 'sh_3k@126.com', // 收件列表
        subject: 'Hello sir', // 标题
        //text和html两者只支持一种
        text: 'Hello world ?', // 标题
        html: '<b>Hello world ?</b>', // html内容
        attachments: [
            {
                filename: 'text1.txt',
                path: 'C:/Users/x1/Desktop/ATT00001.txt'
            }
        ]
    };
    let transporter = nodemailer.createTransport({
        service: '126',
        port: 25, // SMTP 端口
        secureConnection: true, // 不使用 SSL
        auth: {
            user: 'ybt2016@126.com',
            pass: 'ybt2016' //这里密码不是qq密码，是你设置的smtp密码
        }
    });

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: ' + info.response);

    });
}

