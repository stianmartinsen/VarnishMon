'use strict';

angular.module('varnishMonApp')
    .controller('Menu', function ($scope, $location) {
        $scope.location = $location;
        $scope.links = [
            {name: 'Hit rate', url: '#/hitmiss'},
            {name: 'About', url: '#/about'},
            {name: 'Elg.no', url: 'http://elg.no'},
        ]
    });
