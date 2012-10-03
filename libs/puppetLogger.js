var _ = require('underscore');
var messageModel, connectionModel;
var ObjectId = require('mongoose').Types.ObjectId;

module.exports.init = function(service) {
	messageModel = service.useModel('Message');
	connectionModel = service.useModel('Connection');
};

module.exports.logMessage = function(user, connection, to, from, message) {
	var msg = new messageModel.Message();
	msg.owner = user._id;
	msg.connection = connection;
	msg.channel = to;
	msg.sender = from;
	msg.message = message;
	msg.timestamp = Date.now();
	msg.save(handleError);
};

module.exports.retrieveMessages = function(user, connection, to, returner) {
	var query = { owner: new ObjectId(user._id.toString()), connection:connection, channel:to };
	messageModel.Message.find(query,
		null,
		{limit: 50, sort: { timestamp: -1 }},
		function(err, messages) {
			messages.reverse();
			var results = _.map(messages, function(msg) { return { from: msg.sender, to: msg.channel, message: msg.message, timestamp: msg.timestamp }; } );
			returner(to, results);
	});
};

module.exports.savePuppetState = function(user, puppet) {
	var query = { owner: new ObjectId(user._id.toString()), connection: puppet.opt().server };
	connectionModel.Connection.findOne(query,
		function(err, connection) {
			if (!connection) connection = new connectionModel();
			connection.owner = user._id;
			connection.connection = puppet.opt().server;
			connection.channels = _.keys(puppet.channels());
			connection.save(handleError);
		});
};

module.exports.loadState = function(user, callback) {
	var query = { owner: new ObjectId(user._id.toString()) };
	connectionModel.Connection.find(query, function(err, connections) {
		callback(connections);
	});
};

var handleError = function(err) {
	if (err) {
		console.log(err);
		console.trace();
	}
};