'use strict';

angular.module('varnishMonApp')
    .controller('HitMiss', function ($scope, $timeout, SocketService, GaugeService) {
        $scope.selectedTimeIndex = $scope.selectedTimeIndex || 1;

        $scope.times = [
            {'name': '2 minutes', 'min': 2},
            {'name': '5 minutes', 'min': 5},
            {'name': '10 minutes', 'min': 10},
            {'name': '30 minutes', 'min': 30},
            {'name': '2 hours', 'min': 120},
            {'name': '6 hours', 'min': 360},
            {'name': '12 hours', 'min': 720},
            {'name': '24 hours', 'min': 1440}
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

        // Gauge
        var updateGaugePromise,
            updateGauge = function () {
                var minutes = $scope.times[$scope.selectedTimeIndex].min,
                    q = 'asPercent(summarize(stats.hit,"' + minutes + 'min","sum",true),summarize(stats.totalHits,"' + minutes + 'min","sum",true))'
                ;

                socket.of('/monitor').emit('get', 'from=-' + minutes + 'minutes&format=json&target=' + q, function (res) {
                    var data = JSON.parse(res);
                    hitMissGauge.redraw(data[0].datapoints[0][0] || 0);
                });
                updateGaugePromise = $timeout(updateGauge, 1000);
            };

        updateGauge();

        // Graph
        var updateGraphPromise,
            graph,
            updateGraph = function () {
                var minutes = $scope.times[$scope.selectedTimeIndex].min,
                    q = 'stats.miss&target=stats.hit';
                ;

                if (minutes >= 120) {
                    q = 'summarize(stats.miss,"10min")&target=summarize(stats.hit,"10min")';
                }

                if (minutes >= 360) {
                    q = 'summarize(stats.miss,"60min")&target=summarize(stats.hit,"60min")';
                }

                socket.of('/monitor').emit('get', 'from=-' + minutes + 'minutes&format=json&target=' + q, function (res) {
                    console.log(res);
                    var data = JSON.parse(res),
                        miss = data[0],
                        hit = data[1],
                        totalHits = data[2],
                        arr = [
                            ['date'],
                            ['hit'],
                            ['miss']
                        ];

                    for (var i = 0; i < hit.datapoints.length; i++) {
                        var date = new Date();
                        date.setTime(hit.datapoints[i][1]*1000);
                        var year = date.getFullYear(),
                            month = date.getMonth() + 1,
                            day = date.getDate(),
                            hours = date.getHours(),
                            minutes = date.getMinutes(),
                            seconds = date.getSeconds();

                        arr[0].push(year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds);
                        arr[1].push(hit.datapoints[i][0]);
                    };
                    for (var i = 0; i < miss.datapoints.length; i++) {
                        arr[2].push(miss.datapoints[i][0]);
                    };

                    if (!graph) {
                        graph = c3.generate({
                            bindto: '#hitMissGraph',
                            data: {
                                x: 'date',
                                x_format: '%Y-%_m-%_d %_H:%_M:%_S',
                                columns: arr,
                                type: 'spline'
                            },
                            axis: {
                                x: {
                                    type: 'timeseries',
                                },
                                y: {
                                    label: 'Requests pr second'
                                }
                            }
                        });
                    } else {
                        graph.load({
                            columns: arr
                        });
                    }
                });
                updateGraphPromise = $timeout(updateGraph, 1000);
            };

        updateGraph();


        $scope.$on(
            "$destroy",
            function( event ) {
                $timeout.cancel(updateGaugePromise);
                $timeout.cancel(updateGraphPromise);
            }
        );
    });