'use strict';
/**
 * 全局参数
 */
module.exports = {

    //数据库参数
    cDburl:'mongodb://100td:27117/test',

    //数据采集参数
    cSiteUrl : 'http://sh.lianjia.com',
    cInitUrl : '/ershoufang/xujiahui/s7', //以特定板块为入口，查询版块内的房源单价升序查询，只查前60个单价最低的。

    //性能参数
    cDcInterval : 2380, //两次采集之间的时间
    cMaxPageNum : 50, //采集页面的数量，如果太多可能会造成内存溢出。

    cEsfFields:{'bsr':1,
            'cfmd':1,'sized':1,'floord':1,'tpriced':1,
            'size':1,'floor':1,'tprice':1,'uprice':1,
            'layout':1,'title':1,'hrname':1,'zone':1,'_id':0
    },//导出前查询的字段
    cEsfSortBy:{'bsr':1}, //导出文件时的排序字段，按照笋度排序

    //excel导出时保存的目录
    cExlExpPath:'./',

    //excel导出时的列名
    cEsfFieldsName2:['笋度','小区名','核定单价','小区单价','房源单价','综合折率','总价','折率','楼层','折率','面积','折率','年份','折率','房型','标题','URL'],
    cEsfFields2:{
        _id:0,
        bsr:{$divide:['$uprice',{$multiply:['$cfmd','$hrap']}]},
        hrname:1,
        cfmp:{$multiply:['$cfmd','$hrap']},
        hrap:1,
        uprice:1,
        cfmd:1,
        tprice:1,
        tpriced:1,
        floor:1,
        floord:1,
        size:1,
        sized:1,
        bdyear:1,
        bdyeard:1,
        layout:1,
        title:1,
        url:1
    },
    cEsfSortBy2:{bsr:1},
    bsrLessThen: 0.95

};