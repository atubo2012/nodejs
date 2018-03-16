export dateymd=`date '+%Y%m%d'`
export LANG=en_US.UTF-8
export PATH=$PATH:/root/download/node-v6.11.0-linux-x64/bin
cd /root/workspace/nodejs/cheerio

mv  *.xlsx ./data
# 江北
node dc_common.js dchr jiangbei
node dc_common.js dcesf beibinlu
node dc_common.js dcesf dazhulin
node dc_common.js dcesf dashiba
node dc_common.js dcesf guanyinqiao
node dc_common.js dcesf huahuiyuan
node dc_common.js dcesf haierlu
node dc_common.js dcesf huangnibang
node dc_common.js dcesf hongensi
node dc_common.js dcesf jiangbeizui
node dc_common.js dcesf longtousi
node dc_common.js dcesf nanqiaosi
node dc_common.js dcesf ranjiaba
node dc_common.js dcesf shizishan
node dc_common.js dcesf shimahe
node dc_common.js dcesf wulidian1
node dc_common.js dcesf yuzui

#渝北
node dc_common.js dchr yubei
node dc_common.js dcesf beihuan
node dc_common.js dcesf cuiyun
node dc_common.js dcesf caifuzhongxin1
node dc_common.js dcesf dazhulin
node dc_common.js dcesf huixing
node dc_common.js dcesf huayuanxincun
node dc_common.js dcesf jiazhou
node dc_common.js dcesf konggangxincheng
node dc_common.js dcesf lianglu
node dc_common.js dcesf longxi
node dc_common.js dcesf lijia
node dc_common.js dcesf qibozhongxin
node dc_common.js dcesf renhe
node dc_common.js dcesf songshuqiao
node dc_common.js dcesf xinpaifang
node dc_common.js dcesf yuanboyuan
node dc_common.js dcesf yuanyang
node dc_common.js dcesf yuelai
node dc_common.js dcesf zhaomushan

#南岸
node dc_common.js dchr nanan
node dc_common.js dcesf bagongli
node dc_common.js dcesf chayuanxinqu
node dc_common.js dcesf danlonglu
node dc_common.js dcesf danzishi
node dc_common.js dcesf liugongli
node dc_common.js dcesf nanbinlu
node dc_common.js dcesf nanshan3
node dc_common.js dcesf nanping
node dc_common.js dcesf qigongli
node dc_common.js dcesf rongqiaobandao
node dc_common.js dcesf sigongli

#巴南
node dc_common.js dchr banan
node dc_common.js dcesf bagongli
node dc_common.js dcesf jieshi
node dc_common.js dcesf longzhouwan
node dc_common.js dcesf lijiatuo1
node dc_common.js dcesf ronghuibandao
node dc_common.js dcesf yudong2

#沙坪坝
node dc_common.js dchr shapingba
node dc_common.js dcesf chenjiaqiao
node dc_common.js dcesf ciqikou
node dc_common.js dcesf daxuecheng2
node dc_common.js dcesf fengtianlu
node dc_common.js dcesf gongrencun
node dc_common.js dcesf hualongqiao
node dc_common.js dcesf laodonglu
node dc_common.js dcesf lishuwan
node dc_common.js dcesf lieshimu
node dc_common.js dcesf shiqiaopu
node dc_common.js dcesf sanxiaguangchang
node dc_common.js dcesf shazhengjie
node dc_common.js dcesf shabinlu
node dc_common.js dcesf tianxingqiao
node dc_common.js dcesf xiaolongkan
node dc_common.js dcesf yubeilu
node dc_common.js dcesf yanggongqiao
node dc_common.js dcesf zhanxilu

#九龙坡
node dc_common.js dchr jiulongpo
node dc_common.js dcesf baguocheng
node dc_common.js dcesf baishiyi
node dc_common.js dcesf chenjiaping
node dc_common.js dcesf caiyunhu
node dc_common.js dcesf daping
node dc_common.js dcesf dongwuyuan
node dc_common.js dcesf erlang
node dc_common.js dcesf huangjueping
node dc_common.js dcesf huayan
node dc_common.js dcesf mawangxiang
node dc_common.js dcesf maoxiangou
node dc_common.js dcesf panlong
node dc_common.js dcesf shipingqiao
node dc_common.js dcesf xiejiawan
node dc_common.js dcesf xipeng
node dc_common.js dcesf yuanjiagang
node dc_common.js dcesf yangjiaping



#渝中
node dc_common.js dchr yuzhong
node dc_common.js dcesf chaotianmen
node dc_common.js dcesf daping
node dc_common.js dcesf hualongqiao
node dc_common.js dcesf jiefangbei1
node dc_common.js dcesf lianglukou
node dc_common.js dcesf shangqingsi

#大渡口
node dc_common.js dchr dadukou
node dc_common.js dcesf buxingjie
node dc_common.js dcesf baguocheng
node dc_common.js dcesf dadukouqufu
node dc_common.js dcesf jiugongmiao
node dc_common.js dcesf jianshecun
node dc_common.js dcesf mawangxiang
node dc_common.js dcesf shuangshan

#江津
node dc_common.js dchr jiangjing
node dc_common.js dcesf binjiangzhonglu
node dc_common.js dcesf dongmen
node dc_common.js dcesf dongbuxincheng
node dc_common.js dcesf jiangjinjiaoxian
node dc_common.js dcesf langshanpianqu
node dc_common.js dcesf laochengqu
node dc_common.js dcesf xiduan
node dc_common.js dcesf xiangruipianqu


node dc_common.js setap
node dc_common.js mccfmd
node dc_common.js expdata

mail -s "ljcq" -a ljcqesf-$dateymd.xlsx sh_3k@126.com <  a.msg

cp log/ljcq.log log/ljcq-$dateymd.log
