'use strict';

angular.module('varnishMonApp')
    .controller('Configure', function ($scope, SocketService) {
        var socket = SocketService.socket;

        $scope.config = [];

        function getParams(resp) {
            var lines = resp.split("\n");
            lines.shift();

            var params = [];

            for (var line of lines) {
                var cmd = line.match(/^([^ ]+)\s+(.+)/);
                if (cmd) {
                    params.push([cmd[1], cmd[2]]);
                }
            }

            return params;
        }

        socket.of('/varnish')
            .emit('cmd', 'param.show', function (resp) {
                var responsCode = parseInt(resp.slice(0, 3), 10),
                    success = responsCode === 200;

                if (success) {
                    $scope.$apply(function () {
                        $scope.config = getParams(resp)
                    });
                }
            })
        ;
    });
