var express = require('express');
var app = express();

app.use(express.static('public'));
app.use(express.static('bower_components'));
app.use(express.static('build'));

app.get('/', function (req, res) {
  res.send('Hello Wor!ld?!');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
