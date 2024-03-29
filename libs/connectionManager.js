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
	if (!_connectedClients[userId])
		_connectedClients[userId] = [];

	if (_.contains(_connectedClients[userId], socketId))
		return;
	_connectedClients[userId].push(socketId);

	var socket = _clients[socketId];
	socket.on('connectServer', function(data) {
		_puppeteer.connect(user, data.connection, self);
	});

	socket.on('removeServer', function(data) {
		var puppet = _puppeteer.puppets()[userId][data.connection];
		puppet.quit();
	});

	socket.on('join', function(data) {
		var puppet = _puppeteer.puppets()[userId][data.connection];
		puppet.join(data.channel);
	});

	socket.on('part', function(data) {
		var puppet = _puppeteer.puppets()[userId][data.connection];
		puppet.part(data.channel);
	});

	socket.on('message', function(data) {
		var puppet = _puppeteer.puppets()[userId][data.connection];
		puppet.message(data.channel, data.text);
	});
};

module.exports.clients = function() {
	return _clients;
};

module.exports.connectedClients = function() {
	return _connectedClients;
};