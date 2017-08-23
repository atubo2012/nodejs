'use strict';

/**
 * TOOLKIT，用来学习验证js的语言特性。
 * 新功能先通过本文件验证，具有通用性的代码，将迁移到xxutil.js中用于生产环境
 */


let ut = require('./utils');

/**
 * 住测试函数，所有的测试类函数都通过main函数调用来测试
 */
function main(){
    //console.log(ut.formatDate(new Date(),'hhmmss'));
    //console.log(getCfmDisct(156,'低区/22层',580));
    mathTest();
}

main();


/**
 * 取整、四舍五入、取随机数
 */
function mathTest(){

    let n = 3.45333;
    //随机数类
    console.log('取随机数='+Math.random()); //返回0和1间(包括0,不包括1)的一个随机数。

    //从第3位小数开始，四舍五入，保留两位小数。
    console.log(n+'四舍五入保留2位小数='+Math.round(n*100)/100);

    //保留3位小数
    console.log(n+'保留3位小数='+n.toFixed(3));

    //四舍五入类
    console.log(n+'四舍五入后的整数='+Math.round(n)); //返回n四舍五入后整数的值。
    console.log('取0或1随机数='+Math.round(Math.random())); //可均衡获取0到1的随机整数。
    console.log('0-10内随机整数='+Math.round(Math.random() * 10)); //获取0到10的随机整数，其中获取最小值0和最大值10的几率少一半。

    //向大取整类
    console.log(n+'向大整数='+Math.ceil(n)); // 返回大于等于n的最小整数。
    console.log('1-10内随机整数='+Math.ceil(Math.random() * 10)); //取1到10的随机整数，取0的几率极小。

    //向小取整
    console.log(n+'向小整数='+Math.floor(n)); //返回小于等于n的最大整数。
    console.log('9以内取整='+Math.floor(Math.random() * 10)); //，可均衡获取0到9的随机整数。
}
/**
 * 根据相关因素计算【核定折扣】，(核定折扣*挂牌均价/小区均价)=笋度。
 * @param size 面积
 * @param floor 楼层
 * @param tprice 总价
 */
function getCfmDisct(size,floor,tprice){

    let sizeDisct = 1;
    if(size>150 && size<=200){
        sizeDisct = 0.9;
    }else if(size>200){
        sizeDisct = 0.8;
    }
    console.log(size+'平米:'+sizeDisct*10+'折');

    let tpriceDisct = 1;
    if(tprice>1000 && tprice<=2000){
        sizeDisct = 0.9;
    }else if(tprice>2000){
        sizeDisct = 0.8;
    }
    console.log(tprice+'万:'+tpriceDisct*10+'折');

    let floorDisct = 1;
    let level = 0;
    let floortype = '';
    if(floor.indexOf('地上')>=0)
    {
        floortype = '别墅';
    }else{
        level = floor.replace('层','').replace('区/','').replace('地上','').replace('高','').replace('中','').replace('低','');
        if(level.valueOf()>=8)
        {
            floortype = '高层';
            if(floor.indexOf('低区')>=0){
                floorDisct = 0.85;
            }
        }else{
            floortype = '多层';
            if(floor.indexOf('高区')>=0 || floor.indexOf('低区')>=0){
                floorDisct = 0.9;
            }
        }
    }
    console.log(floortype+'-'+floor+':'+floorDisct*10+'折');

    return {'sized':sizeDisct,'tpriced':tpriceDisct,'floord':floorDisct};

    //console.log('总折扣:'+Math.round(floorDisct*sizeDisct,4));

}



/**
 * exports测试
 */

function exportTest(){
    let ut  = require('./utils.js');
    console.log(ut.formatDate2(new Date(),'yyyyMMdd'));
}


/**
 * 测试命令行参数
 * @type {Array.<*>}
 */
function cmdArgs() {
    let args = process.argv.splice(2);
    console.log(args);
    if(args.length<1)
    {
        console.error('应至少包含一个参数');
    }else{
        export2xls();
    }
}



/**
 * 串行执行函数
 */
function asynTest() {
    let methodArray  = [];
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

    function addMethod(m){
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
 * 字符替换
 * @type {string}
 */
function strReplaceTest() {
    let a = '单价784元/平米';
    console.log(a.replace('单价','').replace('元/平米',''));
}


/**
 * 日期格式测试
 * @type {Date}
 * ================================
 *  */
function dateTest() {
    let d  = new Date();
    let today = d.getFullYear()+'-'+d.getMonth()+1+'-'+d.getDate();
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
    let DB_CONN_STR='mongodb://100td:27117/test';
    let xlsx = require('node-xlsx');
    let fs = require('fs');

    let MongoClient = require('mongodb').MongoClient;
    MongoClient.connect(DB_CONN_STR, function(err, db) {
        console.log('连接成功');
        selectData(db, function(result) {
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

    let selectData = function(db, callback) {
        let collection = db.collection('esf'); //哪个表
        collection.find().limit(60).skip(0).toArray(function(err, result) {  //读取60条数据
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

    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return console.log(error);
        }
        console.log('Message sent: ' + info.response);

    });
}

