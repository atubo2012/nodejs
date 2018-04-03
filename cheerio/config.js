'use strict';
/**
 * 全局参数
 */

let config = {

    //数据库参数
    //cDburl:'mongodb://100td:27117/pspdb',
    cDburl: 'mongodb://100td:27117/test2',
    cMaxListener: 300,  //最大的监听器数量，避免“11 uncaughtException listeners added”报错。
    cMaxRcd: 80000,//dbutil中一次性检索出来的最多的记录数

    //数据采集参数
    cSiteUrl: 'https://sh.lianjia.com',
    cUrlPrefix: '/ershoufang/',
    cUrlPostfix: '/co32/',
    cInitUrl: '/ershoufang/jinqiao/co32/', //以特定板块为入口，查询版块内的房源单价升序查询，只查前60个单价最低的。


    //性能参数
    cDcInterval: 2000, //两次采集之间的时间
    cMaxPageNum: 100, //采集页面的数量，如果太多可能会造成内存溢出。

    cEsfFields: {
        'bsr': 1,
        'cfmd': 1, 'sized': 1, 'floord': 1, 'tpriced': 1,
        'size': 1, 'floor': 1, 'tprice': 1, 'uprice': 1,
        'layout': 1, 'title': 1, 'hrname': 1, 'zone': 1, '_id': 0
    },//导出前查询的字段
    cEsfSortBy: {'bsr': 1}, //导出文件时的排序字段，按照笋度排序

    //excel导出时保存的目录
    cExlExpPath: './',

    //excel导出时的列名
    cEsfFieldsName2: ['笋度', '看', '关', '挂', '新上', '区', '板', '小区',
        '年份', '年份折率', '楼层', '楼层折率', '面积', '面积折率',
        '小区单价', '房源单价', '核定单价', '综合折率',
        '总价', '总价折率', '房型', '标题', 'URL'],
    cEsfFields2: {
        _id: 0,
        bsr: {$divide: ['$uprice', {$multiply: ['$cfmd', '$hrap']}]},
        seeamt: 1,
        favamt: 1,
        asktime: 1,
        isnew: 1,
        sdist: 1,
        zone: 1,
        hrname: 1,

        bdyear: 1,
        bdyeard: 1,
        floor: 1,
        floord: 1,
        size: 1,
        sized: 1,

        hrap: 1,
        uprice: 1,
        cfmp: {$multiply: ['$cfmd', '$hrap']},
        cfmd: 1,

        tprice: 1,
        tpriced: 1,
        layout: 1,
        title: 1,
        url: 1
    },
    expConditions: [
        {isnew: '新上'},
   //     {asktime: '刚刚发布'},
        {hrap: {$gt: 0}},//该条件必须存在，因为有些小区的均价为0，如该条件不存在则可能出现导出失败
        {size: {$gt: 40}},
    ],
    cEsfSortBy2: {bsr: 1},
    bsrLessThen: 0.95,
    dcNewOnly: true,     //是否只导出新上架的记录
    iclParkInfo: false,    //是否包含车位，默认是不包括
    xclZones: {          //不予采集的板块
        'sh': [
            //'浦东','闵行','宝山','徐汇' ,'普陀', '杨浦','长宁','黄浦','静安','闸北','虹口',
            '松江', '嘉定', '青浦', '奉贤', '金山', '崇明', '上海周边'
        ],
        'cd': [],
        'cq': ['八宝街'],
        'hz': [],
        'nj': [],
        'xa': [],
        'wh': [],
        'sz': [],
        'tj': [],
        'su': [],
        'bj':[]
    },
    dss: {       //数据源
        'zy': {
            siteUrl: '{}.centanet.com',
            protocol: 'http',
        }
    },
    //经纪人导出的字段
    jjrFieldsName: ['区', '板', '姓名', '职位', '累计成交', '30天带看', '标签', '电话', 'URL'],
    jjrFieldsValue: {
        _id: 0,
        dist: 1,
        zone: 1,
        name: 1,
        position: 1,
        sell: 1,
        looked: 1,
        label: 1,
        phone: 1,
        url: 1
    },
    jjrSortBy: {
        sell: -1,    //按销售量降序排列
        //looked:-1   //按带看量降序排列
    },
    jjrFilter:
        {
            $or: [
                {$and: [{looked: {$gte: 15}}, {sell: {$gte: 15}}]},
                {$and: [{looked: {$eq: 0}}, {sell: {$eq: 0}}]},
            ]
        }
};

module.exports = config;