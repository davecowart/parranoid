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