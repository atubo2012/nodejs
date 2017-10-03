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
 * 检查一个字符串是否为数字
 * @param str
 * @returns {boolean}
 */
exports.isNumber = function (str) {
    let a = parseFloat(str);

    if(isNaN(a)){
        //log(str +' is not number '+a);
        return false;
    }else{
        //log(str +' is  number '+a);
        return true;
    }
};




