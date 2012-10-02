var _ = require('underscore');

function ConnectionManager(puppeteer) {
	var self = this;
	self.clients = {};
	self.connectedClients = {};
	self.connect = function(user, socketId) {
		var userId = user._id;
		if (!self.connectedClients[userId])
			self.connectedClients[userId] = [];
		self.connectedClients[userId].push(socketId);

		var socket = self.clients[socketId];
		socket.on('connectServer', function(data) {
			puppeteer.connect(user, data.connection, self);
		});

		socket.on('removeServer', function(data) {
			var puppet = puppeteer.puppets()[userId][data.connection];
			puppet.quit();
		});

		socket.on('join', function(data) {
			var puppet = puppeteer.puppets()[userId][data.connection];
			puppet.join(data.channel);
		});

		socket.on('part', function(data) {
			var puppet = puppeteer.puppets()[userId][data.connection];
			puppet.part(data.channel);
		});

		socket.on('message', function(data) {
			var puppet = puppeteer.puppets()[userId][data.connection];
			puppet.message(data.channel, data.text);
		});
	};
}

module.exports = function (app, service, puppeteer, server) {
	var io = require('socket.io').listen(server);
	var clientManager = new ConnectionManager(puppeteer);

	io.sockets.on('connection', function(socket) {
		clientManager.clients[socket.id] = socket;
	});

	app.get('/client', ensureAuthenticated, function(req, res) {
		res.render('client/index', {user: req.user });
	});

	app.post('/client/connect', ensureAuthenticated, function(req, res) {
		var socketId = req.param('socketid');
		clientManager.connect(req.user, socketId);
		respondWithJson(res);
	});

	app.get('/client/refresh', ensureAuthenticated, function(req, res) {
		var puppets = puppeteer.puppets()[req.user._id];
		var result = _.map(puppets, function(puppet) { return { server: puppet.opt(), chans: puppet.channels() }; });
		respondWithJson(res, result);
	});

	app.get('/client/catchup', ensureAuthenticated, function(req, res) {
		var puppets = puppeteer.puppets()[req.user._id];
		var puppetKeys = _.keys(puppets);
		var output = [];

		console.log('gatherer definition (in clientcontroller)');
		var gatherer = _.after(puppetKeys.length, function() {
			respondWithJson(res, output);
		});

		console.log('messageCallback definition');
		var messageCallback = function(conn, messages) {
				output.push({ connection: conn, messages: messages });
				console.log('calling clientcontroller.gatherer');
				gatherer();
		};

		console.log('puppet loop: ' + puppetKeys.length);
		for (var i = puppetKeys.length - 1; i >= 0; i--) {
			console.log('calling messages');
			var puppetMessages = puppets[puppetKeys[i]].messages(messageCallback);
		}

		// var output = _.map(puppets, function(puppet) { return { connection: puppet.opt().server, messages: puppet.messages() }; });
		// respondWithJson(res, output);
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