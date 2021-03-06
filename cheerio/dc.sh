#本文件被/etc/crontab文件定期调用执行

#设置机密信息
. /root/workspace/su/setsecinfo.sh
. /root/workspace/su/setenv.sh


#export LANG=en_US.UTF-8
export dateymd=`date '+%Y%m%d'`

#进入工作目录
cd /root/workspace/nodejs/cheerio

#0、清理本地目录中导出的数据文件
mv  ljesf*.xlsx ./data
mv  *.txt ./data

#1、清理数据库
echo "db.esf.remove({})" | mongo 100td:27117/$SI_DC_DBNAME
echo "db.hrhis.remove({})" | mongo 100td:27117/$SI_DC_DBNAME
#2、采集数据

#node dc_lianjia.js minhang
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

#node dc_lianjia.js baoshan
node dc_lianjia.js dachangzhen
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

#node dc_lianjia.js xuhui
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


#node dc_lianjia.js putuo
node dc_lianjia.js changfeng
node dc_lianjia.js changshoulu
node dc_lianjia.js caoyang
node dc_lianjia.js changzheng
node dc_lianjia.js ganquanyichuan
node dc_lianjia.js guangxin
node dc_lianjia.js taopu
node dc_lianjia.js wanli
node dc_lianjia.js wuning
node dc_lianjia.js zhenguang
node dc_lianjia.js zhenru
node dc_lianjia.js zhongyuanliangwancheng

#node dc_lianjia.js yangpu
node dc_lianjia.js anshan
node dc_lianjia.js dongwaitan
node dc_lianjia.js huangxinggongyuan
node dc_lianjia.js kongjianglu
node dc_lianjia.js wujiaochang
node dc_lianjia.js xinjiangwancheng
node dc_lianjia.js zhoujiazuilu
node dc_lianjia.js zhongyuan1

#node dc_lianjia.js changning
node dc_lianjia.js beixinjing
node dc_lianjia.js gubei
node dc_lianjia.js hongqiao1
node dc_lianjia.js tianshan
node dc_lianjia.js xinhualu
node dc_lianjia.js xijiao
node dc_lianjia.js xianxia
node dc_lianjia.js zhenninglu
node dc_lianjia.js zhongshangongyuan

#node dc_lianjia.js jiading
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
node dc_lianjia.js xinchenglu1
node dc_lianjia.js xuxing

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
node dc_lianjia.js sichuanbeilu

#node dc_lianjia.js fengxian
#node dc_lianjia.js jinshan
#node dc_lianjia.js chongming
#node dc_lianjia.js songjiang
node dc_lianjia.js chedun
node dc_lianjia.js jiuting
node dc_lianjia.js maogang
node dc_lianjia.js shihudang
node dc_lianjia.js shenminbieshu
node dc_lianjia.js songjiangxincheng
node dc_lianjia.js sheshan
node dc_lianjia.js songjiangdaxuecheng
node dc_lianjia.js sijing
node dc_lianjia.js songjianglaocheng
node dc_lianjia.js xincheng
node dc_lianjia.js xiaokunshan
node dc_lianjia.js xinbang
node dc_lianjia.js yexie

#node dc_lianjia.js pudongxinqu
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
node mc_lianjia.js

#3、导出数据
#用mongoexport工具导出的模式，导出后还要替换文本文件中的双引号
#echo "导出文本文件"
#mongoexport -h 100td --port 27117 -d test -c esf -f uprice,tprice,layout,hrname,zone --sort {uprice:1} --csv  -o $dateymd.txt
#cat $dateymd.txt | sed 's/\"//g' > $dateymd.txt

#用nodejs程序导出成为excel文件
echo "导出excel文件......"
node export2xls.js

#4、发送邮件给相关人员
echo "发送邮件......"
mv ./log/cron.log ./log/cron-$dateymd.log
mv *.html ./log

mail -s "lj $dateymd" -a ljesf-$dateymd.xlsx $mu01 <  ./log/cron-$dateymd.log
mail -s "lj $dateymd" -a ljesf-$dateymd.xlsx $mu02 < a.msg
mail -s "lj $dateymd" -a ljesf-$dateymd.xlsx $mu03 < a.msg

echo "发送邮件ok"
