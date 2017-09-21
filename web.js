var express = require('express');
var cors = require('cors');
var logfmt = require('logfmt');
var momolog = require('momolog');

var app = express();
app.use(cors());
app.use(logfmt.requestLogger());

var collection = process.env.DEBUG ? 'log-debug' : 'log';
momolog.connect(process.env.MONGODB_URI, collection).then(function(logger) {
  app.use(logger);

  app.use(express.static(__dirname));

  var port = Number(process.env.PORT);
  app.listen(port, function () {
      console.log('Listening on ' + port);
  });
});

