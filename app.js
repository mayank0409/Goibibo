var express = require('express'),
    app = express();

app.listen(8080, function () {
   console.log('Server listening on port 8080');
});
app.get('/', function(req, res) {
   res.send('hello world');
});
