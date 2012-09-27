var puppet = require('./puppet');
var puppets = {}; //an organized crate of puppets

module.exports.connect = function(user, connection, clientManager, channels, done) {
	var userId = user._id;
	var dummy = getDummy(userId, connection);
	if (!dummy) {
		dummy = puppet.init(user, connection, clientManager, channels, done);
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

function getDummy(userId, connection) {
	if (puppets[userId] && puppets[userId][connection])
		return puppets[userId][connection];
	return null;
}