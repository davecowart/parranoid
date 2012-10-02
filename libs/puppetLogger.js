var _ = require('underscore');
var service, messageModel;
var ObjectId = require('mongoose').Types.ObjectId;

module.exports.init = function(svc) {
	service = svc;
	messageModel = service.useModel('Message');
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
	console.log('retrieving');
	console.log(query);

	messageModel.Message.find(query,
		null,
		{limit: 50, sort: { timestamp: -1 }},
		function(err, messages) {
			console.log('returned');
			console.log(messages);
			messages.reverse();
			var results = _.map(messages, function(msg) { return { from: msg.sender, to: msg.channel, message: msg.message, timestamp: msg.timestamp }; } );
			returner(to, results);
	});
};

var handleError = function(err) {
	if (err) {
		console.log(err);
		console.trace();
	}
};