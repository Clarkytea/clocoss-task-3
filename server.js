var express = require('express');
var app = express();

var port = process.env.PORT || 8080;

app.use('/api', require('./api'));
app.use(express.static('static'));

app.listen(8080);
console.log('API is running on 8080');
