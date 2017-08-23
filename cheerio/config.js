'use strict';
/**
 * 全局参数
 */
module.exports = {

    //数据库参数
    cDburl:'mongodb://100td:27117/test',

    //数据采集参数
    cSiteUrl : 'http://sh.lianjia.com',
    cInitUrl : '/ershoufang/lujiazui/s3', //以特定板块为入口，查询版块内的房源单价升序查询，只查前60个单价最低的。

    //性能参数
    cDcInterval : 2780, //两次采集之间的时间
    cMaxPageNum : 2, //采集页面的数量，如果太多可能会造成内存溢出。
};