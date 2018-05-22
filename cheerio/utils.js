'use strict';

/**
 * 将日期格式化
 */
exports.formatDate = function(date, style) {
    return fmd(date,style);
};

/**
 * 取得今天的日期
 */
exports.getToday = function() {
    return fmd(new Date(),'yyyyMMdd');
};

/**
 * 取得现在的时间
 */
exports.getNow = function() {
    return fmd(new Date(),'hhmmss');
};

function fmd(date, style) {
    let y = date.getFullYear();
    let M = "0" + (date.getMonth() + 1);
    M = M.substring(M.length - 2);
    let d = "0" + date.getDate();
    d = d.substring(d.length - 2);
    let h = "0" + date.getHours();
    h = h.substring(h.length - 2);
    let m = "0" + date.getMinutes();
    m = m.substring(m.length - 2);
    let s = "0" + date.getSeconds();
    s = s.substring(s.length - 2);
    return style.replace('yyyy', y).replace('MM', M).replace('dd', d).replace('hh', h).replace('mm', m).replace('ss', s);
}

/**
 * 根据相关因素计算【核定折扣】，(核定折扣*挂牌均价/小区均价)=笋度。
 * @param size 面积 4位数值型
 * @param floor 楼层 2位数值型
 * @param tprice 总价（单位万） 数值型
 * @param bdyear 建造年份 4位数值型
 */

exports.getCfmDisct2 = function(size,floor,tprice,bdyear){

    let sizeDisct = 1;
    if(size>150 && size<=200){
        sizeDisct = 0.95;
    }else if(size>200){
        sizeDisct = 0.9;
    }
    //console.log(size+'平米:'+sizeDisct*10+'折');

    let tpriceDisct = 1;
    if(tprice>1000 && tprice<=2000){
        tpriceDisct = 0.95;
    }else if(tprice>2000){
        tpriceDisct = 0.9;
    }
    //console.log(tprice+'万:'+tpriceDisct*10+'折');

    let floorDisct = 1;  //默认的楼层折扣
    let bdyearDisct = 1; //默认的建设年份折扣
    let level = 0;
    let floortype = '';


    if(floor.indexOf('(')>=0)
    {
        level = floor.substring(floor.indexOf('共')+1,floor.indexOf('层)'));
        if(level.valueOf()>=8)
        {
            floortype = '高层';
            if(floor.indexOf('低楼层')>=0){
                floorDisct = 0.95;
            }
        }else{
            floortype = '多层';
            if(floor.indexOf('高楼层')>=0 || floor.indexOf('低楼层')>=0){
                floorDisct = 0.95;
            }
        }
    }else{
        floortype = '别墅';
    }

    //bdyear = bdyear.replace('|','').replace('年建','');
    if(Number(bdyear)<1990)
    {
        bdyearDisct = 0.95;
    }else if(Number(bdyear)<1998){
        bdyearDisct = 0.98;
    }

    let cfmd = (sizeDisct.toFixed(2)*tpriceDisct.toFixed(2)*floorDisct.toFixed(2)*bdyearDisct.toFixed(2)).toFixed(3);
    cfmd =Math.round(cfmd *100)/100; //最低折扣
    //console.log(floortype+'-'+floor+':'+floorDisct*10+'折');
    //console.log('核定折扣:'+cfmd);
    return {'sized':sizeDisct,'tpriced':tpriceDisct,'floord':floorDisct,'bdyeard':bdyearDisct,'cfmd':cfmd};

};

exports.getCfmDisct = function(size,floor,tprice,bdyear){

    let sizeDisct = 1;
    if(size>150 && size<=200){
        sizeDisct = 0.9;
    }else if(size>200){
        sizeDisct = 0.8;
    }
    //console.log(size+'平米:'+sizeDisct*10+'折');

    let tpriceDisct = 1;
    if(tprice>1000 && tprice<=2000){
        tpriceDisct = 0.9;
    }else if(tprice>2000){
        tpriceDisct = 0.8;
    }
    //console.log(tprice+'万:'+tpriceDisct*10+'折');

    let floorDisct = 1;  //默认的楼层折扣
    let bdyearDisct = 1; //默认的建设年份折扣
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

    bdyear = bdyear.replace('|','').replace('年建','');
    if(Number(bdyear)<1990)
    {
        bdyearDisct = 0.9;
    }else if(Number(bdyear)<1998){
        bdyearDisct = 0.95;
    }

    let cfmd = (sizeDisct.toFixed(2)*tpriceDisct.toFixed(2)*floorDisct.toFixed(2)*bdyearDisct.toFixed(2)).toFixed(3);
    cfmd =Math.round(cfmd *100)/100; //最低折扣
    //console.log(floortype+'-'+floor+':'+floorDisct*10+'折');
    //console.log('核定折扣:'+cfmd);
    return {'sized':sizeDisct,'tpriced':tpriceDisct,'floord':floorDisct,'bdyeard':bdyearDisct,'cfmd':cfmd};

};

/**
 * 显示内存消耗变化情况在重要函数的开始和结束时调用。
 * 参数值一般填写：开始XXXX、结束XXXXX
 */
exports.showLog = function(msg) {
    log(msg);
};

/**
 * 输出日志
 * @param msg
 */
function log(msg) {
        let mem = process.memoryUsage();
        let format = function(bytes) {
            return (bytes/1024/1024).toFixed(2);
        };
        let now = fmd(new Date(),'hhmmss');
        console.log('['+now+']'+'[Mem' + format(mem.rss)+'/'+format(mem.heapTotal) + '/' + format(mem.heapUsed) + ']:['+msg+']');
}


/**
 * 导出形如excel文件
 * @param dataArray 数组类型的数据
 * @param path 以/结尾的路径名
 * @param filename 文件名
 */
exports.exp2xls = function(dataArray,path,filename) {

    let xlsx = require('node-xlsx');
    let fs = require('fs');

    log('开始生成EXCEL');
    let file = xlsx.build([{
        name: 'sheet1',
        data: dataArray
    }]);   //构建xlsx对象

    fs.writeFileSync(path+filename+'.xlsx', file, 'binary'); // 写入
    log('完成生成EXCEL');
};

/**
 * 将对象的value转换成数组
 * 如果要将key转换成数组，就push(item)
 */
function obj2Array (obj) {
    let arr = [];
    for (let itm in obj) {
        arr.push(obj[itm]);
    }
    return arr;
}
exports.obj2Array = function(obj){
    return obj2Array(obj);
};


/**
 * 按照数组keys的顺序将对象中的值转换成素组
 * @param obj
 * @param keys
 * @returns {Array}
 */
function obj2ArrayByOrder (obj,keys) {
    let arr = [];
    //遍历keys，并将
    keys.forEach(function (item) {
        arr.push(obj[item])
    }) ;
    return arr;
}
exports.obj2ArrayByOrder=function(obj,keys){
    return obj2ArrayByOrder(obj,keys);
};
obj2ArrayByOrder({'a':'a1','b':'b1'},['b','a']);


/**
 * 将对象数组转化为元素为数组的数组
 * @param objArray
 * @returns {Array}
 */
exports.objArray2Array =function (objArray) {
    let ret = [];
    objArray.forEach(function (item) {
        ret.push(obj2Array(item));
    });
    return ret;
};


/**
 * 检查一个字符串是否为数字
 * @param str
 * @returns {boolean}
 */
exports.isNumber = function (str) {
    let a = parseFloat(str);

    // if(isNaN(a)){
    //     //log(str +' is not number '+a);
    //     return false;
    // }else{
    //     //log(str +' is  number '+a);
    //     return true;
    // }

    return !isNaN(a);
};

/**
 * 检查某个对象是否有元素
 * hasElmt(obj.aa)，如有该对象则返回真。
 * @param obj
 * @returns {boolean}
 */
exports.hasElmt = function (obj) {
    return (typeof(obj) !== 'undefined') ;
};

/**
 * 读取指定文件的内容
 * @param filename
 * @returns {Buffer | string}
 */
exports.rf = function (filename) {
    return require('fs').readFileSync(filename,'utf8');
};
/**
 * 向文件中写入指定的内容
 * @param filename
 * @param content
 */
exports.wf = function (filename,content) {
    let fs = require('fs');
    fs.writeFileSync(filename, content, 'utf8', function(err) {
        if (err) {
            console.error('写入文件时发生错误',err);
        }
    });
};

/**
 * 向指定文件中以追加模式写入内容
 * @param filename
 * @param content
 */
exports.af = function(filename,content){
    fs.appendFileSync(filename,content,'utf-8',(err)=>{
        if(err) throw err;
        console.log('写入文件时发生错误',err);
    });
};

exports.getOs = function(){
    return require('os');
};


/**
 * 当前时刻与指定时刻的差。
 * @param timer hhmm格式，表示小时分钟
 * @returns {number} 毫秒， >=0表示已过期，<0表示尚未过期
 */
function getTimeDiffrence(timer) {

    //设置then的时间对象
    let then = new Date();
    then.setHours(parseInt(timer.substring(0,2)));
    then.setMinutes(parseInt(timer.substring(2,4)));
    then.setSeconds(0);

    //计算当前时间与then的时差
    return (new Date() - then);
}
exports.getTimeDiffrence = function(timer){
    return getTimeDiffrence(timer);
};

/**
 * (day2 - day1) / (1000 * 60 * 60 * 24)
 * 减号分割的格式化函数：endDate.replace(/\-/g, "\/")
 * @param rms2
 */

/**
 * 从配置信息筛选出应提醒的任务，形成任务列表
 * @param cfg 由配置文件生成的对象
 */
function getAlerts(cfg) {

    let todaysTask = [];//今日的发送任务

    /**
     * 遍历配置文件，找出符合以下三个条件的当日任务列表。任务列表将login()函数内的定时轮询程序读取
     * 完成一项任务，删除一项任务项:
     * 1、当前日期在起止日期之间。
     * 2、当前日期在频度序列内。如未配置频度序列frequency，则表示每天此刻执行。
     * 3、启动时刻晚于当前时刻。
     */
    cfg.forEach((item) => {
        item.contents.filter(function (elmt) {

            //1、校验当前日期是否在起止日期之间
            let fromDate = new Date(elmt.from);
            let toDate = new Date(elmt.to);
            let now = new Date();
            let isInRange = (now >= fromDate && now < toDate);

            //2、校验当前日期是否在频度序列中
            let isOnToday = false;
            let dateOfMonth = now.getDate().toString();
            let dayOfWeek = now.getDay().toString();
            if (elmt.frequence) {
                isOnToday =
                    ((elmt.frequence.dateOfMonth) && (elmt.frequence.dateOfMonth.indexOf(dateOfMonth) >= 0)) ||
                    ((elmt.frequence.dayOfWeek) && (elmt.frequence.dayOfWeek.indexOf(dayOfWeek) >= 0));
            } else {
                isOnToday = true;
            }

            //3、启动时刻晚于当前时刻。
            let isLateThenNow = (getTimeDiffrence(elmt.timer)<0);


            //console.log(elmt.timer,isLateThenNow,isInRange,isOnToday);

            //若三个条件都满足，则纳入到任务列表中
            if (isInRange && isOnToday && isLateThenNow) {
                todaysTask.push({'timer': elmt.timer, 'content': elmt.content, 'groups': item.groups,'handler':elmt.handler});
                //return true;
            }
        });
    });
    return todaysTask;
}
exports.getAlerts = function(cfg){
    return getAlerts(cfg);
};


//加密函数参考：https://nodejs.org/dist/latest-v6.x/docs/api/crypto.html#crypto_class_cipher
const crypto = require('crypto');

/**
 * 检查是否为有效的算法。
 * @param alg
 */
function isValidAlg(alg) {
    //可通过命令查看OS支持的算法：openssl list-cipher-algorithms
    const algs = ['aes192','aes-128-ecb','aes-256-cbc'];

    const err = alg+'不是可选的算法，应为'+algs+'内的算法之一';
    if(algs.indexOf(alg)<0) throw err;
}

/**
 * 对称加解密函数
 * @param data
 * @param key
 * @param aesType
 * @param codeType
 * @returns {*}
 */
function aesEncrypt(data,key,aesType,codeType){
    isValidAlg(aesType);
    const cipher = crypto.createCipher(aesType,key);
    let crypted = cipher.update(data,'utf8',codeType);
    return crypted+cipher.final(codeType);
}
exports.aesEncrypt= function(data,key,aesType,codeType){
    return aesEncrypt(data,key,aesType,codeType);
};

function aesDecrypt(encryptedData,key,aesType,codeType){
    isValidAlg(aesType);
    const decipher = crypto.createDecipher(aesType,key);
    let decrypted = decipher.update(encryptedData,codeType,'utf8');
    return decrypted+decipher.final('utf8');
}
exports.aesDecrypt= function(encryptedData,key,aesType,codeType){
    return aesDecrypt(encryptedData,key,aesType,codeType);
};

/**
 *
 * @param data 原文
 * @param hashType md5/hmac
 * @param algType md5/sha1/sha256/sha512
 * @param codeType hex/base64
 * @param key hmac使用的key
 * @returns {Buffer | string | * | any}
 */
function getHash(data,hashType,algType,codeType,key){
    let ret = null;
    if (/md5/.test(hashType)) {
        ret = crypto.createHash(algType).update(data).digest(codeType);
    }
    else if (/hmac/.test(hashType)) {
        ret = crypto.createHmac(algType,key).update(data).digest(codeType);
    }

    return ret;
}
exports.getHash= function(data,hashType,algType,codeType,key){
    return getHash(data,hashType,algType,codeType,key);
};


exports.normalizeFileName = function(fileName){
    //暂不替换中文标点符号:.，。？
    let ret = fileName.replace(/[":&#$*|><,?\/\+\\\[\]]/g,'');
    if(ret.length>=250)
        ret = ret.substring(0,250);
    //参考：https://www.cnblogs.com/moqing/archive/2016/07/13/5665126.html
        //http://www.jb51.net/article/110516.htm
        //http://www.jb51.net/article/84784.htm
        //http://www.jb51.net/article/80544.htm
        //console.log('原文件名',fileName);
        //console.log('新文件名',ret);
    return ret;

};


/**
 * 功能：校验主持群和收听群配置信息的合法性
 * 场景：wechaty启动时检查配置
 *
 * @param forward
 * @returns {boolean}
 */
function isValidForword(forward){
    let ret = true;
    for(let i = 0 ;i<forward.length;i++){
       if(forward[i].to.indexOf(forward[i].from)>=0)
       {
           console.error('主持群['+forward[i].from+']的收听群['+forward[i].to+']中不应包括与主持群名称相同的群，请从收听群中删除['+forward[i].from+']');
           return false;
       }

    }
    return ret ;
}
exports.isValidForword= function(forward){
    return isValidForword(forward);
};
// let forward= [
//         {from: '200弄',to: ['测试群123','测试2']},
//     {from: '三(6)班不聊群',to: ['200弄不聊群']},
//     {from: '太阳花成长讨论区',to: ['200弄不聊群']},
//     {from: '测试群123',to: ['test333','测试群123']},
//     ];
// console.log(isValidForword(forward));

/**
 * 发送httpx请求
 * @param httpType http|https
 * @param url 资源链接
 * @param cb 对请求获得的应答进行处理
 */
function httpxReq(httpType,url,cb){
    let httpx = require(httpType);
    let iconv = require("iconv-lite");

    let _url=httpType+'://'+url;
    httpx.get(_url, function (res) {

        let datas = [];
        let size = 0;

        res.on('data', function (data) {

            datas.push(data);
            size += data.length;

        });
        res.on("end", function () {
            let buff = Buffer.concat(datas, size);
            let result = iconv.decode(buff, "utf8");
            cb(result);

        });
    }).on("error", function (err) {
        console.error(err,'httpx请求失败');
    });
}

exports.getWeather = function(cb){
    let ret = '';
    httpxReq('http', 'v.juhe.cn/weather/index?cityname=%E4%B8%8A%E6%B5%B7&dtype=&format=&key=ffd9caaa66c61ad531bb259f135cbcc4', (result) => {

        //应答的包括今日与将来的天气信息
        let weather = JSON.parse(result);

        //今日天气
        let todayWeather = weather.result.today;

        //明日日期
        let now = new Date();
        let nextDay = now.setTime(fmd(new Date(now.getTime() + 24 * 60 * 60 * 1000), 'yyyyMMdd'));

        //明日天气
        let nextDayWeather = weather.result.future['day_' + nextDay];
        let nextDayWeatherDesc =
            '天气'+nextDayWeather.weather+
            '，气温'+nextDayWeather.temperature+
            '，风力'+nextDayWeather.wind;

        //计算两日的温差
        let ndt = nextDayWeather.temperature.replace(/℃/g, '').split('~');
        let tdt = todayWeather.temperature.replace(/℃/g, '').split('~');
        let tdiff = [ndt[0] - tdt[0], ndt[1] - tdt[1]];


        console.log(tdiff);

        ret = '明日'+nextDayWeatherDesc+'。与今天相比，高温' + getDescription(tdiff[0])+' 低温' + getDescription(tdiff[1]);
        cb(ret);
    });

};

function getDescription(temperatureDiff){
    let ret = '';
    if(temperatureDiff>0)  ret = '【热'+temperatureDiff+'度】';
    if(temperatureDiff<0)  ret = '【凉'+temperatureDiff+'度】';
    if(temperatureDiff===0) ret = '气温相同';
    return ret;
}


let item={handler1:'testfunc'};

if(item.handler)
{
    console.log('包含处理函数，执行处理函数');
    let handler = eval(item.handler);
    handler(console);
}
function testfunc(aaa){
    aaa.log('hahah this is testfunc');
}

