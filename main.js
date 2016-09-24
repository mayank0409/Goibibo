/**
 * Created by mayank on 24/9/16.
 */



var app = angular.module('busBooking',[]);

app.controller('busCtrl', function($scope, $http) {
    $http.get("static.json")
        .then(function(response) {
            $scope.buses = response.data;
        });

});

