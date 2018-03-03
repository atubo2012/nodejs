// console.log('hello world');
//
// console.log('王艺然');
// console.log('王雪');

let counter = 1;

/**
 * 数据
 *  对象，其中包括多个属性
 *  数组，一组数据，每个数据，有个编号。
 *  变量
 *  常量，常量，单引号中的绿色内容。
 *
 * @type {{name: string, age: number, sex: string}}
 */

//对象：每个元素有属性名字，是用大括号定义一个对象
let student01 = {name: '宋昊天', age: 9, sex: 'male'};
let student02 = {name: '丁睿麟', age: 9, sex: 'male'};


//数组:每个元素没有属性名字，但是有下标。用方括号定义一个数组。
let classmates = [student01, student02];

//新来了两个同学
let student03 = {name: '王艺然', age: 8, sex: 'female'};
let student04 = {name: '王浩晨', age: 9, sex: 'male'};

//新来的学生与原来的学生成为同学
classmates.push(student03);
classmates.push(student04);

//看看一共有几名同学
for (let index = 0;index < classmates.length;index = index + 1) {
    console.log(classmates[index]);
}

//新建一个班级：g3c6
let g3c6 = {}; console.log('g3c6班级被创建后的内容：'+JSON.stringify(g3c6));

//为班级指定老师
g3c6.cteacher='贺迪';
g3c6.eteacher='唐洁莉'; //console.log('指定老师后的班级='+JSON.stringify(g3c6));


//将同学分配到班级
g3c6.classmates = classmates; //console.log('指定学生后的班级='+JSON.stringify(g3c6));


//请新建一名体育老师
g3c6.pteacher='张名';

let student05={name:'李四', age:8, sex: 'male'};


//请将老师加入到班级中



//请新建一名同学李四






console.log('班级最新的情况是='+JSON.stringify(g3c6));
let threeGradeSixClass = [];

