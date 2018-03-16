'use strict';
/**
 * 全局参数
 */
module.exports = {

    //数据库参数
    cDburl:'mongodb://100td:27117/pspdb',
    cMaxListener: 300,  //最大的监听器数量，避免“11 uncaughtException listeners added”报错。
    cMaxRcd:80000,//dbutil中一次性检索出来的最多的记录数

    //数据采集参数
    cSiteUrl : 'https://sh.lianjia.com',
    cUrlPrefix:'/ershoufang/',
    cUrlPostfix:'/co32/',
    cInitUrl : '/ershoufang/taopu/co32/', //以特定板块为入口，查询版块内的房源单价升序查询，只查前60个单价最低的。


    //性能参数
    cDcInterval : 5000, //两次采集之间的时间
    cMaxPageNum : 100, //采集页面的数量，如果太多可能会造成内存溢出。

    cEsfFields:{'bsr':1,
            'cfmd':1,'sized':1,'floord':1,'tpriced':1,
            'size':1,'floor':1,'tprice':1,'uprice':1,
            'layout':1,'title':1,'hrname':1,'zone':1,'_id':0
    },//导出前查询的字段
    cEsfSortBy:{'bsr':1}, //导出文件时的排序字段，按照笋度排序

    //excel导出时保存的目录
    cExlExpPath:'./',

    //excel导出时的列名
    cEsfFieldsName2:['笋度','看','关','挂','小区','板','区','核定单价','小区单价','房源单价','综合折率','总价','折率','楼层','折率','面积','折率','年份','折率','房型','标题','URL'],
    cEsfFields2:{
        _id:0,
        bsr:{$divide:['$uprice',{$multiply:['$cfmd','$hrap']}]},
        seeamt:1,
        favamt:1,
        asktime:1,
        hrname:1,
        zone:1,
        sdist:1,
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
    bsrLessThen: 0.98

};
