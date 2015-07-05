var config = require('cloud-env'),
    http = require('http'),
    remoteCall = require('./utils').remoteCall,
    responseHeaders = {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
    };

http.createServer(function (req, res) {
    remoteCall(req.url, function (err, json) {
        res.writeHead(200, responseHeaders);
        res.end(JSON.stringify(json));
    });
}).listen(config.get('PORT', 8000), config.get('IP', '127.0.0.1'));