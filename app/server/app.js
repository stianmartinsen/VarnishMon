var express = require('express');
var http = require('http');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var net = require('net');

var os = require('os');
var io = require('socket.io').listen(8984);

// send minified client
io.enable('browser client minification');
// apply etag caching logic based on version number
io.enable('browser client etag');
// gzip the file
io.enable('browser client gzip');
// reduce logging
io.set('log level', 1);
// color the log
io.set('log colors', true);
// close timeout
io.set('close timeout', 60);
// heartbeat timeout
io.set('heartbeat timeout', 60);
// heartbeat interval
io.set('heartbeat interval', 30);
// enable all transports
io.set('transports', ['websocket', 'flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']);

var monitor = io
    .of('/monitor')
    .on('connection', function(socket) {
        socket.on('get', function (data, cb) {
            console.log(data);
            var opts = {
                hostname: 'graphite.torjus',
                port: 80,
                path: '/render?' + data
            };

            var req = http.get(opts, function (res) {
                var data = '';
                res.on('data', function (chunk) {
                    data += chunk;
                }).on('end', function () {
                    cb(data);
                });
            });
        });
    });

var varnish = net.createConnection({
    port: 6082
});
var ATTEMPT_RECONNECT = false;
var broadcastState = function (state) {};
var handleVarnishResp = function () {};

var reconnect = function () {
    var interval = setInterval(function () {
        if (!ATTEMPT_RECONNECT) {
            clearInterval(interval);
        }

        if (ATTEMPT_RECONNECT) {
            console.log('Attempting reconnect');
            varnish.connect(6082);
        }
    }, 100);
};

varnish
    .on('connect', function () {
        ATTEMPT_RECONNECT = false;
        console.log('CONNECTED');
        broadcastState('up');
    })
    .on('close', function () {
        if (!ATTEMPT_RECONNECT) {
            broadcastState('down');
            ATTEMPT_RECONNECT = true;
            reconnect();
        }
    })
    .on('error', function () {
        if (!ATTEMPT_RECONNECT) {
            broadcastState('down');
            ATTEMPT_RECONNECT = true;
            reconnect();
        }
    })
    .on('data', function (data) {
        console.log(data.toString());
        handleVarnishResp && handleVarnishResp(data.toString());
    })
;

io.of('/varnish').on('connection', function (socket) {
    broadcastState = function (state) {
        socket.emit(state);
    };

    socket
        .on('ban', function (match, call) {
            if (varnish._handle) {
                handleVarnishResp = call;
                varnish.write('ban ' + match + "\n", 'utf8');
            }
        })
        .on('cmd', function (cmd, call) {
            handleVarnishResp = call;
            varnish.write(cmd + "\n");
        })
        .on('update_status', function () {
            broadcastState(ATTEMPT_RECONNECT ? 'down' : 'up');
        })
        .on('end', function () {
            console.log('Varnish socket disconnected. Attempting reconnect');
            console.log('error %j', arguments);
            varnish.connect();
        })
    ;
});

var routes = require('./routes');
var users = require('./routes/user');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../')));
app.use(app.router);

app.get('/', routes.index);
app.get('/users', users.list);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
