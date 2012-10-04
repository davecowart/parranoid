var _ = require ('underscore');
var _puppeteer, _clients, _connectedClients, self;

module.exports.init = function(puppeteer) {
	_puppeteer = puppeteer;
	_clients = {};
	_connectedClients = {};
	self = this;
};

module.exports.connect = function(user, socketId) {
	var userId = user._id;
	var puppet;
	if (!_connectedClients[userId])
		_connectedClients[userId] = [];

	if (_.contains(_connectedClients[userId], socketId))
		return;
	_connectedClients[userId].push(socketId);

	var socket = _clients[socketId];
	socket.on('connectServer', function(data) {
		_puppeteer.connect(user, data.connection, self);
		puppet = _puppeteer.puppets()[userId][data.connection];
	});

	socket.on('removeServer', function(data) {
		puppet.quit();
	});

	socket.on('join', function(data) {
		puppet.join(data.channel);
	});

	socket.on('part', function(data) {
		puppet.part(data.channel);
	});

	socket.on('message', function(data) {
		puppet.message(data.channel, data.text);
	});
};

module.exports.clients = function() {
	return _clients;
};

module.exports.connectedClients = function() {
	return _connectedClients;
};