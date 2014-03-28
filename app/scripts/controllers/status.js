'use strict';

angular.module('varnishMonApp')
    .controller('Status', function ($scope, SocketService) {
        var socket = SocketService.socket;

        $scope.servers = [
            {
                host: 'localhost',
                port: 6082,
                status: 'unknown'
            }
        ];

        socket.of('/varnish')
            .emit('update_status')
            .on('down', function () {
                $scope.$apply(function () {
                    $scope.servers[0].status = 'DOWN';
                });
            })
            .on('up', function () {
                $scope.$apply(function () {
                    $scope.servers[0].status = 'OK';
                });
            });
    });
