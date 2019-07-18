
rem 清库二手房、小区
node test_case_cleardb.js ljshesf
node test_case_cleardb.js ljshzone

rem 采集源深板块房源的小区和二手房
node dc_common.js dchr sh.yuanshen
node dc_common.js dcesf sh.yuanshen

rem 计算二手房均价
node dc_common.js setap sh.

rem 导出数据到excel和 esf_result表
node dc_common.js expdata sh.

rem
node test_case_cleardb.js ljshesf_result
node dc_common.js save2bamboo sh.

rem 生成租赁采集脚本
node dc_common.js genrentscript sh.
