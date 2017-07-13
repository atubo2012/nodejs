var student = require('./student');
var teacher = require('./teacher');
//teacher.add('Scott')

function add(teacherName, students) {
    teacher.add(teacherName);
    students.forEach(function (item, index) {
        student.add(item)
    })
}

exports.add = add ;//exoprts是module.exports的一个辅助方法

//module.exprots = add //module.exports是真实存在的东西
