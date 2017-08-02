/**
 * require函数的加载机制。
 */



/**
 * 当有多次加载时，只会在第一次执行被加载模块内的程序。
 */

var two = require("./2.js");
var two = require("./2.js");

/**
 * 使用被引入包的属性
 */
console.log(two.name);
console.log(two); //可以将一个被引入的包，以json的格式打印出来

/**
 * module关键字，代表当前模块，是一个对象
 * require是函数
 * require.main是一个对象（函数也可以有对象？）
 */
if(module === require.main){ // ===等号是表示要求类型与内容都要一致；==是要求两边的内容一致
    console.log(module+'是主模块');
    console.log('type of module:'+typeof module); //module是个对象
    console.log('type of require:'+typeof require); //require是函数
    console.log('require.main:'+require.main);//require.main是一个对象
}

/**
 * require.resolve函数能展现出被引入包的所在位置
 */
console.log('./2 所在的文件路径为:'+require.resolve('./2'));

/**
 * require已经引入的模块的缓存区
 * @type {Object}
 */
var cache = require.cache;
console.log('require的缓存：\n');
console.log(cache);


console.log('删除2.js的缓存')
delete require.cache[require.resolve('./2.js')];
console.log('删除后')
console.log(cache);
require('./2.js');