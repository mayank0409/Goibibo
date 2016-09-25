/**
 * Created by mayank on 24/9/16.
 */



var app = angular.module('busBooking',[]);

app.controller('busCtrl', function($scope, $http) {
    $scope.sortType     = 'totalFare'; // set the default sort type
    $scope.sortReverse  = false;  // set the default sort order
    $scope.searchFish   = '';     // set the default search/filter term
    $http.get("static.json")
        .then(function(response) {
            $scope.buses = response.data;
            // angular.forEach($scope.buses,function (bus) {
            //     bus.frontAvailable = bus.front.available;
            //     bus.middleAvailable = bus.middle.available;
            //     bus.lastAvailable = bus.last.available;
            //     bus.available = bus.front.available+bus.middle.available+bus.last.available;
            // });
        });


});

