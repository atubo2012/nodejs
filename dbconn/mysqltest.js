
var mysql = require('mysql');
var connection = mysql.createConnection({
    host: '100td',
    user: 'pwangxue',
    password: '***',
    database:'test'
});

connection.connect();
/**查询
connection.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
    if (err) throw err;
    console.log('The solution is: ', rows[0].solution);
});
 **/

connection.query('select * from `global`', function(err, rows, fields) {
    if (err) throw err;
    console.log('查询结果为: ', rows);
});
//关闭连接
connection.end();