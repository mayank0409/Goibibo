var express = require('express'),
    _ = require('lodash'),
    async = require('async'),
    path = require('path'),
    app = express(),
    format = 'json',
    app_id = 'c59b455b',
    limit = 5,
    app_key = 'f652013eb672d6cb772ba67240bc798e';

app.use(express.static('public'));

app.listen(8080, function () {
   console.log('Server listening on port 8080');
});
app.get('/', function(req, res) {
   res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/search-buses', function(req, res) {
   var params = req.query;
   console.log("input params:",params);
   // params = {
   //    'source': 'delhi',
   //    'destination': 'jalandhar',
   //    'dateofdeparture': '20160925'
   // };
   return getBusDetails(params, function(buses) {
      res.send(buses);
   });


});

function getBusDetails(input, callback) {

   var mandatoryParams = ['source','destination','dateofdeparture'];
   var paramsPresent = checkMandatoryParams(mandatoryParams,input);
   if(!paramsPresent) return "Error";

   input.app_id = app_id;
   input.app_key = app_key;
   input.format = format;
   var path = postParamsToGet(input);
   var url = "/api/bus/search/";
   var method = "GET";
   var busResponse = makeHttpRequest(method,url,path, onBusResponse);

   function onBusResponse(busResponse) {
      console.log("Search buses busResponse: ", busResponse);

      var buses = [];
      var count = 0;
      var skeys = [];
      for (var bus_index in busResponse.data.onwardflights) {
         var bus = busResponse.data.onwardflights[bus_index];
         _.set(bus, 'totalFare', parseFloat(bus.fare.totalfare));
         var filteredBus = _.pick(bus, ['BusType', 'TravelsName', 'busCompany', 'skey', 'mTicket', 'duration', 'busCondition', 'depdate', 'arrdate', 'totalFare']);
         skeys.push(bus.skey);
         buses.push(filteredBus);

         count += 1;
         if (count == limit) break;
      }
      console.log(skeys, buses);

      var q = async.queue(
          function (task, callback) {
             getSeatDetails(task, callback);
          }, 1
      );

      var updatedBuses = [];

      for (var bus_index in buses) {
         var bus = buses[bus_index];
         q.push(bus, function (updatedBus) {
            console.log("updatedBus: ", updatedBus);
            updatedBuses.push(updatedBus);
         });
      }

      q.drain = function() {
         return callback(updatedBuses);
      };
   }
}


function checkMandatoryParams(params, input) {
   for(var index in params) {
      if(!input.hasOwnProperty(params[index])) return false;
   }
   return true;
}


// var searchBusInput = {
//    'source': 'delhi',
//    'dest': 'jalandhar',
//    'date': '20160925'
// };
// var buses = getBusDetails(searchBusInput);
//

function getSeatDetails(bus, callback){

   var input = {};
   var skey = bus.skey;
   input.app_id = app_id;
   input.app_key = app_key;
   input.format = format;
   input.skey = skey;
   var path = postParamsToGet(input);
   var url = "/api/bus/seatmap/";
   var method = "GET";
   var seatResponse = makeHttpRequest(method,url,path, onSeatResponse);

   function onSeatResponse(seatResponse) {
      var front = {available: 0, seats_available: [], sold_out: 0, seats_soldout: []},
          middle = {available: 0, seats_available: [], sold_out: 0, seats_soldout: []},
          back = {available: 0, seats_available: [], sold_out: 0, seats_soldout: []},
          rows = parseInt(seatResponse.data.onwardflightsMaxR),
          remainder = rows % 3,
          numberOfRows = Math.floor(rows / 3);

      if (remainder == 0) {
         front['rows'] = numberOfRows;
         middle['rows'] = numberOfRows;
         back['rows'] = numberOfRows;
      }
      else if (remainder == 1) {

         front['rows'] = numberOfRows;
         middle['rows'] = numberOfRows;
         back['rows'] = numberOfRows + 1;
      }
      else {
         front['rows'] = numberOfRows;
         middle['rows'] = numberOfRows + 1;
         back['rows'] = numberOfRows + 1;
      }

      front['rowIndex'] = 0;
      middle['rowIndex'] = front['rowIndex'] + front['rows'];
      back['rowIndex'] = middle['rowIndex'] + middle['rows'];

      console.log(front, middle, back);

      for (var index in seatResponse.data.onwardSeats) {
         seatResponse.data.onwardSeats[index].SeatName = parseInt(seatResponse.data.onwardSeats[index].SeatName);
      }

      seatResponse.data.onwardSeats = _.sortByOrder(seatResponse.data.onwardSeats, ['SeatName'], ['asc']);

      for (var seat_index in seatResponse.data.onwardSeats) {
         var seat = seatResponse.data.onwardSeats[seat_index];
         var seatAlloted;
         if (parseInt(seat.ColumnNo) < front['rowIndex'] + front['rows']) {
            seatAlloted = allotSeat(front, seat);
         }
         else if (parseInt(seat.ColumnNo) < middle['rowIndex'] + middle['rows']) {
            seatAlloted = allotSeat(middle, seat);
         }
         else {
            seatAlloted = allotSeat(back, seat);
         }
      }

      console.log(front, middle, back);

      var updatedBus = _.merge(bus, {
         front: front,
         middle: middle,
         back: back,
         seatResponse: seatResponse
      });
      return callback(updatedBus);
   }
}

function allotSeat(seatType, seat) {
   if(parseInt(seat.SeatStatus)){
      seatType.available += 1;
      seatType.seats_available.push(seat.SeatName);
   }
   else {
      seatType.sold_out += 1;
      seatType.seats_soldout.push(seat.SeatName);
   }
}

function makeHttpRequest(method, url, path, callback) {
   var http = require("http");

   var options = {
      "method": method,
      "hostname": "developer.goibibo.com",
      "port": null,
      "path": url+path,
      "headers": {
         "cache-control": "no-cache",
         "postman-token": "34755afa-446b-10fb-cf37-c0af4b17eae5"
      }
   };

   console.log("options: ",options);
   var req = http.request(options, function (res) {
      var chunks = [];

      res.on("data", function (chunk) {
         chunks.push(chunk);
      });

      res.on("end", function () {
         var body = Buffer.concat(chunks);
         console.log("parsedBody: ",JSON.parse(body));
         callback(JSON.parse(body));
      });
   });

   req.end();
}

function postParamsToGet(input) {
   var params = "?";
   var count = 1;
   for(var key in input){
      params += key + "=" + input[key];
      if(count!=Object.keys(input).length){
         params+="&";
         count+=1;
      }
   }
   return params;
}