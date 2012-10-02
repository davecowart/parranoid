var puppet = require('./puppet');
var puppets = {}; //an organized crate of puppets
var puppetLogger;

module.exports.init = function(logger) {
	puppetLogger = logger;
};

module.exports.connect = function(user, connection, clientManager, channels, done) {
	var userId = user._id;
	var dummy = getDummy(userId, connection);
	if (!dummy) {
		dummy = puppet.init(user, connection, clientManager, channels, puppetLogger, done);
		console.log(dummy);
		if (!puppets[userId])
			puppets[userId] = {};
		puppets[userId][connection] = dummy;
	} else {
		dummy.connect();
		if (done) done();
	}
};

module.exports.puppets = function() {
	return puppets;
};

module.exports.getLogger = function() {
	return puppetLogger;
};

function getDummy(userId, connection) {
	if (puppets[userId] && puppets[userId][connection])
		return puppets[userId][connection];
	return null;
}