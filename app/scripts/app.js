'use strict';

angular.module('varnishMonApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngRoute'
])
    .config(function ($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'views/main.html',
                controller: 'MainCtrl'
            })
            .when('/hitmiss', {
                templateUrl: 'views/hitmiss.html',
                controller: 'HitMiss'
            })
            .when('/status', {
                templateUrl: 'views/status.html',
                controller: 'Status'
            })
            .when('/ban', {
                templateUrl: 'views/ban.html',
                controller: 'Ban'
            })
            .when('/about', {
                templateUrl: 'views/about.html',
                controller: 'MainCtrl'
            })
            .otherwise({
                redirectTo: '/'
            });
    });
