var config = require('cloud-env'),
    request = require('request'),
    xml2js = require('xml2js'),
    traverse = require('traverse');

var parser = new xml2js.Parser({
    trim: true,
    normalizeTags: true,
    normalize: true,
    mergeAttrs: true,
    explicitArray: false,
    parseBooleans: true
});

var r = request.defaults({
    auth: {
        user: config.get('MOBILE_USERNAME'),
        pass: config.get('MOBILE_PASSWORD')
    },
    headers: {
        'Accept': 'application/xml',
        'Accept-Language': 'ru',
        'Accept-Encoding': 'gzip'
    }
});

function reduceNamespaceInKeys(json) {
    if (typeof json !== 'object') return json;

    var res = {};

    for (var key in json) {
        if (json.hasOwnProperty(key)) {
            var newKey = key.split(':').pop();
            if (typeof json[key] === 'object') {
                if (Array.isArray(json[key])) {
                    res[newKey] = json[key].map(reduceNamespaceInKeys);
                } else {
                    res[newKey] = reduceNamespaceInKeys(json[key]);
                }
            } else {
                res[newKey] = json[key];
            }
        }
    }

    return res;
}


function reduceSingleValueObjects(json) {
    if (typeof json !== 'object') return json;

    var res = {};

    for (var key in json) {
        if (json.hasOwnProperty(key)) {
            if (typeof json[key] === 'object') {
                if (Array.isArray(json[key])) {
                    res[key] = json[key].map(reduceSingleValueObjects);
                } else {
                    var keys = Object.keys(json[key]);
                    if (keys.length === 1 && typeof json[key][keys[0]] !== 'object') {
                        res[key] = json[key][keys[0]];
                    }
                    else {
                        res[key] = reduceSingleValueObjects(json[key]);
                    }
                }
            } else {
                res[key] = json[key];
            }
        }
    }

    return res;
}

exports.remoteCall = function (path, callback) {
    r.get('https://services.mobile.de' + path, function (err, response, body) {
        parser.parseString(body, function (err, json) {
            if (err) callback(err);

            traverse(json).forEach(function (x) {
                if (this.key) {
                    if (this.key.indexOf('xmlns:') === 0) this.remove();
                    else if (this.key.indexOf('xsi:') === 0) this.remove();
                    else if (this.key === 'xml-lang') this.remove();
                    else if (this.key === 'url' && x.indexOf('https://services.mobile.de/') === 0) this.remove();
                }
            });

            json = reduceSingleValueObjects(json);
            json = reduceNamespaceInKeys(json);

            callback(null, json);
        });

    });
};
