
/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    http = require('http'),
    path = require('path'),
    service = require('./libs/service'),
    bundleup = require('bundle-up'),
    environment = require('./environment'),
    puppeteer = require('./libs/puppeteer'),
    passport = require('passport'),
    puppetLogger = require('./libs/puppetLogger'),
    userLogger = require('./libs/userLogger'),
    connectionManager = require('./libs/connectionManager');

var app = express();

bundleup(app, __dirname + '/assets', {
  staticRoot: __dirname + '/public',
  staticUrlRoot: '/',
  bundle: false,
  minifyCss: true,
  minifyJs: true
});

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
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

var server = http.createServer(app);

service.init(environment);
puppetLogger.init(service);
userLogger.init(service);
puppeteer.init(puppetLogger, userLogger);
connectionManager.init(puppeteer);
puppeteer.loadAtAppStart(connectionManager);
console.log('connectionManager');
console.log(connectionManager);
var controllers = require('./libs/controllers')(app, service, puppeteer, server, connectionManager);

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
