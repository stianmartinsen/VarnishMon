'use strict';

angular.module('varnishMonApp')
    .controller('Ban', function ($scope, SocketService) {
        var socket = SocketService.socket;

        $scope.banHistory = [];
        $scope.errorMsg = '';
        $scope.successMsg = '';

        $scope.ban = function () {
            if ($scope.ban.value) {
                socket.of('/varnish').emit('ban', $scope.ban.value, function (resp) {
                    var responsCode = parseInt(resp.slice(0, 3), 10),
                        success = responsCode === 200;
                    console.log(resp);
                    if (!success) {
                        $scope.$apply(function () {
                            $scope.successMsg = '';
                            $scope.errorMsg = 'Bad ban expression';
                        });
                    } else {
                        $scope.banHistory.push($scope.ban.value);

                        $scope.$apply(function () {
                            $scope.errorMsg = '';
                            $scope.successMsg = 'Successfully banned';
                        });
                    }

                    $scope.$apply(function () {
                        $scope.ban.value = '';
                    });
                });
            }
        };
    });
