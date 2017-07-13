var net = require('net');
var hostname = '127.0.0.1';//process.argv[2];
var port = 1338;//process.argv[3];

var client = net.connect({host: hostname, port: port},
    function () {
        console.log('connect to server!');
        client.write('client say : hello world!\r\n');
    });

client.on('data', function (data) {
    console.log('client recieve' + data.toString());
});

client.on('end', function () {
    console.log('client disconnect from server')
    client.end();
});