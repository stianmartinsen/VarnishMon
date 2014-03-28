'use strict';

angular.module('varnishMonApp')
    .controller('HitMiss', function ($scope, $timeout, SocketService, GaugeService) {
        $scope.selectedTimeIndex = $scope.selectedTimeIndex || 1;

        $scope.times = [
            {'name': '1 minute', 'min': 1},
            {'name': '5 minutes', 'min': 5},
            {'name': '10 minutes', 'min': 10},
            {'name': '30 minutes', 'min': 30},
            {'name': '2 hours', 'min': 120},
            {'name': '6 hours', 'min': 360},
            {'name': '12 hours', 'min': 720}
        ];

        function createGauge(name, label, min, max) {
            var config = {
                size: 200,
                label: label,
                min: undefined != min ? min : 0,
                max: undefined != max ? max : 100,
                minorTicks: 5
            };

            var range = config.max - config.min;
            config.greenZones = [{
                from: config.min + range * 0.75,
                to: config.max
            }];
            config.redZones = [{
                from: config.min,
                to: config.min + range * 0.25
            }];

            var gauge = new GaugeService.Gauge(name + "GaugeContainer", config);
            gauge.render();

            return gauge;
        }

        var socket = SocketService.socket;
        var hitMissGauge = createGauge('hitmiss', 'Hit rate');

        var updateGaugePromise,
            updateGauge = function () {
            var minutes = $scope.times[$scope.selectedTimeIndex].min,
                q = 'asPercent(summarize(stats.hit,"' + minutes + 'min","sum",true),summarize(stats.totalHits,"' + minutes + 'min","sum",true))'
            ;
            console.log(minutes);

            socket.of('/monitor').emit('get', 'from=-' + minutes + 'minutes&format=json&target=' + q, function (res) {

                var data = JSON.parse(res);
                hitMissGauge.redraw(data[0].datapoints[0][0] || 0);
            });
            updateGaugePromise = $timeout(updateGauge, 1000);
        };

        updateGauge();

        $scope.$on(
            "$destroy",
            function( event ) {
                $timeout.cancel(updateGaugePromise);
            }
        );
    });