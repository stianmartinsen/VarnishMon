'use strict';

angular.module('varnishMonApp')
    .controller('HitMiss', function ($scope, SocketService, GaugeService) {
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

        var total = function (dataset) {
            var sum = 0;

            for (var i of dataset) {
                sum += i[0];
            }

            return sum;
        };

        var hitMissGauge = createGauge('hitmiss', 'Hit rate');

        var hitVsMiss = function (hit, miss) {
            var totalHit = total(hit.datapoints),
                totalMiss = total(miss.datapoints);

            hitMissGauge.redraw((totalHit / (totalHit + totalMiss) * 100) || 0);
        };

        setInterval(function () {
            socket.of('/monitor').emit('get', 'from=-10minutes&until=now&target=stats.hit&target=stats.miss&format=json', function (res) {
                var data = JSON.parse(res);
                hitVsMiss(data[0], data[1]);
            });
        }, 3000);
    });