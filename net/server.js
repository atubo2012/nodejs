/**
 * Created by x1 on 2017/7/4.
 */
var net = require('net');

var server = net.createServer(function (socket) {
    socket.write('success! \r\n');
    socket.on('data', function (data) {
        console.log('Server recieved :' + data.toString())
    });

    socket.on('end', function () {
        socket.write('end')
    })
});

server.listen(1338, '127.0.0.1');