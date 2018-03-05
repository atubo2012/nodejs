【已完成】
新增年份因素的折扣，将阀值进行参数化 ok-20170828
开发测试库与生产库通过config参数剥离:在测试环境中用test库，生产环境中用pspdb ok
实现命令行参数方式采集 ok
小区采集时会报错 ok-listener超过了10个
排查为什么有些小区的size值是null，导致有些房源无法计算出笋度。-因为数据被截断。
固化采集策略：每隔30分钟采集一个zone，计算均价，更新均价，导出笋盘


TODO:
【PSPDB】
1、
跟踪采集过程中出现报错：MongoError: Invalid Operation, no operations specified

2、
增加采集报文头中的浏览器信息。


3、使用dcutils.js完成以下模块
（1）行政区、板块基础信息采集。一次性。
（2）小区均价采集。轮询模式、采集更新小区的均价信息。upser方式新增小区，更新当日均价(date:uprice)。以便方便的拉出时间线。


4、新增【今日笋盘】算法
（1）今日新上100条
（2）采集更新今日各小区均价。新增小区历史均价采集。http://sh.lianjia.com/xiaoqu/pudongxinqu/
（3）计算新上100条笋度

5、根据某小区的报价，返回价格笋度。

新增小区历史均价采集与计算：
根据小区名称批量更新小区均价和esf中的均价
算法一：（遍历当日的小区名和地址，逐小区获得小区均价，更新当日小区的均价，更新当日二手房中的均价）
算法二：在每条小区采集过程中，即时采集小区均价。

根据小区均价进行可视化呈现

启用数据库权限控制
config参数化折率计算



【工具箱】
0、对每个数据集的采集，定义一个类。将数据集采集的文件独立保存在dc目录中。
1、采数TK：采集-落地-加工-存库-计算-导出-发送
2、采集调度TK：crontab->主调函数->根据采集范围参数启动多个进程开始采集->
3、pm2监控：

【新技能】
mongodb自学教程学习
智能客服机器人


1、在服务器上运行时不能连续执行完就退出了。-延长间隔时间、确认服务器的内存大小、启用discusage
（1）分多个板块，在不同时段导出数据，对数量较大的进行分页采集
（2）将采集的板块参数化




5、规范化参数的命名，便于维护。-尽可能在刚开始写代码的时候就使用规范化的函数和变量命名，以免后续再对代码调整
6、mongodb的match中多个条件匹配的sql语句验证，尽量在db层将计算类的工作完成

浦东采集的板块
lujiazui,yuanshen,yuanshen,huamu,weifang,tangqiao,biyun,jinqiao,lianyang,shibo,
zhangjiang,tangzhen,zhuqiao
nanmatou,sanlin,jinyang,kangqiao,zhoupu,lingangxincheng,
xinchang,yangdong,xuanqiao

【新增字段的修改步骤】
dc程序
折扣计算程序（utils）
导出程序

【未来特性】
新建一个逐页采集的程序。
用程序来调度，避免对操作系统命令依赖。采集函数尽量少做解析和转义的工作，应按照：【采集-清洗/转义-计算-导出-发送】逻辑分层设计。
总控程序根据预设参数，定时、分批次调起单页采集程序。将请求、解析、入库分别提炼成较为通用的函数。对每个数据源的采集，尽量以“配置+解析函数编写”的方式完成。
配置文件的结构：数据源-采集策略(频度、单次页数、容错日志)-解析函数-DB参数-算法阀值-发送对象(用户、管理员)。

【重构】
代码中不用为config中的参数定义新的名称。
统一将require的config的变量命名名为cf，让代码尽量简练。
将大对象设置为null，以释放内存。
==================
【敏捷爬数算法】
upser全量小区信息，更新最新均价
遍历各小区，upser小区内的二手房信息，并计算折扣率和笋度，对笋度小于阀值的入库。


===============中原测试数据

【SOP-软件下发的步骤】
（V）DEV-开发与调试，调试单个板块范围内的数据解析程序
（W）DEV-开发与模块测试，执行多个板块的数据范围，验证程序中对各种数据组合情况都覆盖到了。
（Y）DEV-性能测试，逐渐增加数据范围，测试性能是否,性能不佳的操作增加索引(如批量导出、批量更新等)。
（Z）TST-集成测试，以全量数据范围手动启动，测试性能是否ok，数据库日志中如有超时警告要增加索引
（0）TST-回归测试，执行test.bat(回归测试案例)，验证对不同数据源（lj、zy）的程序是能正常执行的。识别公共函数的变更是否对已有程序有影响
（1）PRD-然后将webstorm中的程序全部提交
（2）PRD-关闭crontab中的自动执行程序，备份生产环境中的程序和配置文件
（3）PRD-提交生产环境中新增的文件到git
（4）PRD-在生产环境中pull出最新版的仓库文件
（5）PRD-模块验证，用测试数据库执行test.bat中的脚本，验证程序(生产环境中的单元测试验证)是否能跑通。
（6）PRD-DB下发，在生产库中更新索引。关闭冗余的日志信息。
（7）PRD-全量验证，使用测试数据库执行dcxxx.sh，全量验证。
（8）PRD-集成验证，crontab自动设置，自动化全量验证。
（8）PRD-切库，将配置文件的数据库指向生产库pspdb，切换到生产库运行。

【采集数据新算法】
1、采集最新房源。期间保存小区地址。
2、遍历新房源。根据小区地址，解析设置房源中该小区的均价。
3、计算更新新房源的笋度和偏离度。






采集板块列表


#node dc_lianjia.js fengxian
#node dc_lianjia.js jinshan
#node dc_lianjia.js chongming
#node dc_lianjia.js songjiang


#node dc_lianjia.js jingan
node dc_lianjia.js caojiadu
node dc_lianjia.js jingansi
node dc_lianjia.js jiangninglu
node dc_lianjia.js nanjingxilu

#node dc_lianjia.js zhabei
node dc_lianjia.js buyecheng
node dc_lianjia.js daning
node dc_lianjia.js pengpu
node dc_lianjia.js xizangbeilu
node dc_lianjia.js yangcheng
node dc_lianjia.js yonghe
node dc_lianjia.js zhabeigongyuan

#node dc_lianjia.js hongkou
node dc_lianjia.js beiwaitan
node dc_lianjia.js jiangwanzhen
node dc_lianjia.js liangcheng
node dc_lianjia.js linpinglu
node dc_lianjia.js luxungongyuan
node dc_lianjia.js quyang
node dc_lianjia.js sicuanbeilu


#changning
node dc_lianjia.js beixinjing
node dc_lianjia.js gubei
node dc_lianjia.js hongqiao1
node dc_lianjia.js tianshan
node dc_lianjia.js xinhualu
node dc_lianjia.js xijiao
node dc_lianjia.js xianxia
node dc_lianjia.js zhenninglu
node dc_lianjia.js zhongshangongyuan

#yangpu
node dc_lianjia.js anshan
node dc_lianjia.js dongwaitan
node dc_lianjia.js huangxinggongyuan
node dc_lianjia.js kongjianglu
node dc_lianjia.js wujiaochang
node dc_lianjia.js xinjiangwancheng
node dc_lianjia.js zhoujiazuilu
node dc_lianjia.js zhongyuan

#node dc_lianjia.js huangpu
node dc_lianjia.js dongjiadu
node dc_lianjia.js dapuqiao
node dc_lianjia.js huaihaizhonglu
node dc_lianjia.js huangpubinjiang
node dc_lianjia.js laoximen
node dc_lianjia.js nanjingdonglu
node dc_lianjia.js penglaigongyuan
node dc_lianjia.js renminguangchang
node dc_lianjia.js shibobinjiang
node dc_lianjia.js wuliqiao
node dc_lianjia.js xintiandi
node dc_lianjia.js yuyuan

#putuo
node dc_lianjia.js changfeng
node dc_lianjia.js changshoulu
node dc_lianjia.js caoyang
node dc_lianjia.js changzheng
node dc_lianjia.js ganquanyichuan
node dc_lianjia.js guanxin
node dc_lianjia.js taopu
node dc_lianjia.js wanli
node dc_lianjia.js wuning
node dc_lianjia.js zhenguang
node dc_lianjia.js zhenru
node dc_lianjia.js zhongyuanliangwancheng

#minhang
node dc_lianjia.js chunshen
node dc_lianjia.js gumei
node dc_lianjia.js huacao
node dc_lianjia.js hanghua
node dc_lianjia.js jinganxincheng
node dc_lianjia.js jinhui
node dc_lianjia.js jinhongqiao
node dc_lianjia.js longbai
node dc_lianjia.js laominhang
node dc_lianjia.js meilong
node dc_lianjia.js maqiao
node dc_lianjia.js pujiang1
node dc_lianjia.js qibao
node dc_lianjia.js wujing
node dc_lianjia.js shenzhuang
node dc_lianjia.js zhuanqiao

#baoshan
node dc_lianjia.js dachang
node dc_lianjia.js dahua
node dc_lianjia.js gucun
node dc_lianjia.js gongfu
node dc_lianjia.js gaojing
node dc_lianjia.js gongkang
node dc_lianjia.js luodian
node dc_lianjia.js luojing
node dc_lianjia.js songbao
node dc_lianjia.js shangda
node dc_lianjia.js songnan
node dc_lianjia.js tonghe
node dc_lianjia.js yanghang
node dc_lianjia.js yuepu
node dc_lianjia.js zhangmiao

#xuhui
node dc_lianjia.js caohejing
node dc_lianjia.js changqiao
node dc_lianjia.js huadongligong
node dc_lianjia.js huajing
node dc_lianjia.js hengshanlu
node dc_lianjia.js jianguoxilu
node dc_lianjia.js kangjian
node dc_lianjia.js longhua
node dc_lianjia.js shanghainanzhan
node dc_lianjia.js tianlin
node dc_lianjia.js wantiguan
node dc_lianjia.js xuhuibinjiang
node dc_lianjia.js xujiahui
node dc_lianjia.js xietulu
node dc_lianjia.js zhiwuyuan


#pudongxinqu
node dc_lianjia.js lujiazui
node dc_lianjia.js yuanshen
node dc_lianjia.js huamu
node dc_lianjia.js weifang
node dc_lianjia.js tangqiao
node dc_lianjia.js biyun
node dc_lianjia.js jinqiao
node dc_lianjia.js lianyang
node dc_lianjia.js shibo
node dc_lianjia.js zhangjiang
node dc_lianjia.js tangzhen
node dc_lianjia.js zhuqiao
node dc_lianjia.js nanmatou
node dc_lianjia.js sanlin
node dc_lianjia.js jinyang
node dc_lianjia.js kangqiao
node dc_lianjia.js zhoupu
node dc_lianjia.js lingangxincheng
node dc_lianjia.js xinchang
node dc_lianjia.js yangdong
node dc_lianjia.js xuanqiao


#jiading
node dc_lianjia.js anting
node dc_lianjia.js fengzhuang
node dc_lianjia.js huating
node dc_lianjia.js jiadinglaocheng
node dc_lianjia.js jiadingxincheng
node dc_lianjia.js jiangqiao
node dc_lianjia.js juyuanxinqu
node dc_lianjia.js malu
node dc_lianjia.js nanxiang
node dc_lianjia.js waigang
node dc_lianjia.js xinchenglu
node dc_lianjia.js xuxing

