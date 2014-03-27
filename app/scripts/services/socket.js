angular.module('varnishMonApp')
    .service('SocketService', function () {
        var socket = new io.connect("http://" + location.hostname + ":" + 8984);

        this.socket = socket;
    });