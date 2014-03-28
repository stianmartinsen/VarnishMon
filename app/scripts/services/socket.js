angular.module('varnishMonApp')
    .service('SocketService', function () {
        var socket = new io.connect("http://" + location.hostname + ":" + 8984);

        socket.on('disconnect', function () {
            alert('Socket disconnected');
        }).on('error', function () {
            alert('Error from socket');
        });

        this.socket = socket;
    });