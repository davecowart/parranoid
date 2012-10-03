var _ = require('underscore');

module.exports = function (app, service, puppeteer, server, connectionManager) {
	var io = require('socket.io').listen(server);
	io.configure(function () {
		io.set("transports", ["xhr-polling"]);
		io.set("polling duration", 10);
	});
	
	io.sockets.on('connection', function(socket) {
		connectionManager.clients()[socket.id] = socket;
	});

	app.get('/client', ensureAuthenticated, function(req, res) {
		res.render('client/index', {user: req.user });
	});

	app.post('/client/connect', ensureAuthenticated, function(req, res) {
		var socketId = req.param('socketid');
		connectionManager.connect(req.user, socketId);
		respondWithJson(res);
	});

	app.get('/client/refresh', ensureAuthenticated, function(req, res) {
		var puppets = puppeteer.puppets()[req.user._id];
		if (!puppets) respondWithJson(res, []);
		var result = _.map(puppets, function(puppet) { return { server: puppet.opt(), chans: puppet.channels() }; });
		respondWithJson(res, result);
	});

	app.get('/client/catchup', ensureAuthenticated, function(req, res) {
		var puppets = puppeteer.puppets()[req.user._id];
		if (!puppets) respondWithJson(res, []);
		var puppetKeys = _.keys(puppets);
		var output = [];

		var gatherer = _.after(puppetKeys.length, function() {
			respondWithJson(res, output);
		});

		var messageCallback = function(conn, messages) {
				output.push({ connection: conn, messages: messages });
				gatherer();
		};

		for (var i = puppetKeys.length - 1; i >= 0; i--) {
			puppets[puppetKeys[i]].messages(messageCallback);
		}
	});

	function ensureAuthenticated(req, res, next) {
		if (req.isAuthenticated()) { return next(); }
		res.redirect('/login?returnUrl=%2fclient');
	}

	function respondWithJson(res, object) {
		if (typeof object === "boolean") object = { success : object };
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.write(JSON.stringify(object || { success: true }));
		res.end();
	}
};