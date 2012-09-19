
/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    http = require('http'),
    path = require('path'),
    service = require('./libs/service'),
    environment = require('./environment'),
    puppeteer = require('./libs/puppeteer');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
});

var server = http.createServer(app);

service.init(environment);
var controllers = require('./libs/controllers')(app, service, server);

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);

puppeteer.connect({ _id: 14, irc_username: 'davecowbot' }, 'irc.freenode.net', ['#ix2-bot', '#ix2-test'], function() { console.log('connected');});

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
