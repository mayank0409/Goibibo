/**
 * Created by mayank on 24/9/16.
 */



var app = angular.module('busBooking',[]);

app.controller('busCtrl', function($scope, $http) {
    $scope.sortType     = 'totalFare'; // set the default sort type
    $scope.sortReverse  = false;  // set the default sort order
    $scope.searchFish   = '';     // set the default search/filter term
    $scope.buses = []; // initializing the empty buses result

    $scope.front = false;
    $scope.middle = false;
    $scope.back = false;
    $scope.number = 1;
    // $http.get("static.json")
    //     .then(function(response) {
    //         $scope.buses = response.data.data;
    //         // angular.forEach($scope.buses,function (bus) {
    //         //     bus.frontAvailable = bus.front.available;
    //         //     bus.middleAvailable = bus.middle.available;
    //         //     bus.lastAvailable = bus.last.available;
    //         //     bus.available = bus.front.available+bus.middle.available+bus.last.available;
    //         // });
    //     });


    $scope.toggleFront = function () {
        $scope.front = !$scope.front;
    };

    $scope.toggleMiddle = function () {
        $scope.middle = !$scope.middle;
    };

    $scope.toggleBack = function () {
        $scope.back = !$scope.back;
    };

    // $scope.dateofdeparture = '20160926';
    $scope.searchBuses = function(){
        $('#preloader').addClass('active');
        $scope.date = $('.datepicker').val();
        $scope.dateofdeparture = moment($scope.date).format('YYYYMMDD');
        if(!$scope.source || $scope.source =='') {
            alert('Please enter a source');
            $scope.removePreloader();
        }
        else if(!$scope.destination || $scope.destination =='') {
            alert('Please enter a destination');
            $scope.removePreloader();
        }
        else if(!$scope.dateofdeparture || $scope.dateofdeparture =='') {
            alert('Please enter a date of departure');
            $scope.removePreloader();
        }
        else {
            console.log($scope.source, $scope.destination, $scope.dateofdeparture);
            var params = "?source=" + $scope.source + "&destination=" + $scope.destination + "&dateofdeparture=" + $scope.dateofdeparture;
            $http.get("/search-buses" + params).then(function (response) {
                console.log("response: ",response);
                $scope.buses = response.data;
                $scope.removePreloader();
            });
        }
    };

    $scope.removePreloader = function () {
        $('#preloader').removeClass('active');
    };

    $scope.filterTypeOfSeats = function (bus) {
        if($scope.front && bus.front.available < $scope.number ) {
            return false;
        }
        else if($scope.middle && bus.middle.available < $scope.number ) {
            return false;
        }
        else if($scope.back && bus.back.available < $scope.number ) {
            return false;
        }
        else {
            return true;
        }
    };

    $scope.formatDate = function (date) {
        return moment(date).format("hh:mm A");
    }
    
});

