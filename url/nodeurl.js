var http = require('http');
var url = require('url');
const querystr = require('querystring');

http.createServer(function (req, res) {
    if (req.method == "POST") {
        doPost(req, res);
    } else if (req.method == "GET") {
        doGet(req, res);
    } else {
        res.end();
    }
}).listen(1337, '127.0.0.1');

console.log('http server started ......')

function doPost(req, res) {
    //console.log('in doPost:'+req);
    //res.writeHead(200,{'Content-Type':'text/html'});
    //res.write('<H1>in doPost</H1>');

    var formData = '';

    //组装请求中的数据
    req.on('data', function (data) {
        formData += data;
    });

    //收到end时，将收到的数据解析
    req.on('end', function () {
        var obj = querystr.parse(formData)
        console.log(obj);
        res.end();
    })

}

function doGet(req, res) {
    console.log('in doGet:' + req.url);

    //获得请求链接中的查询参数
    var urlObj = querystr.parse(url.parse(req.url).query);
    console.log(urlObj);
    console.log(req.toString());

    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('<H1>in doGet</H1>');
    res.write('<html>');
    res.write('<body>');
    res.write('<form method="post">');
    res.write('username:<input name="username" value="你好啊">');
    res.write('password:<input name="password" type="password" value="aaaa">');
    res.write('password:<input name="submit" type="submit">');
    res.write('</form>');
    res.write('</body>');
    res.write('</html>');
    res.end();


}
/**
 * Created by x1 on 2017/7/4.
 */
