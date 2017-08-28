'use strict';

/**
 * 将日期格式化
 */
exports.formatDate = function(date, style) {
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
};

/**
 * 根据相关因素计算【核定折扣】，(核定折扣*挂牌均价/小区均价)=笋度。
 * @param size 面积
 * @param floor 楼层
 * @param tprice 总价
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
        sizeDisct = 0.9;
    }else if(tprice>2000){
        sizeDisct = 0.8;
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
    let mem = process.memoryUsage();
    let format = function(bytes) {
        return (bytes/1024/1024).toFixed(2)+'MB';
    };
    console.log('rss ' + format(mem.rss)+' ht '+format(mem.heapTotal) + ' hu ' + format(mem.heapUsed) + ' :'+msg);

};

