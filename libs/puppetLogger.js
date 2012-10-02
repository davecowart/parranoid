var service, messageModel;

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

var handleError = function(err) {
	if (err) {
		console.log(err);
		console.trace();
	}
};