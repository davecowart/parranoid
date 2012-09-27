var puppet = require('./puppet');
var puppets = {}; //an organized crate of puppets

module.exports.connect = function(user, connection, clientManager, channels, done) {
	var userId = user._id;
	var dummy = getDummy(userId, connection);
	if (!dummy) {
		dummy = puppet.init(user, connection, clientManager, channels, done);
		if (!puppets[userId])
			puppets[userId] = {};
		puppets[userId][connection] = dummy;
	} else {
		if (done) done();
	}
};

function getDummy(userId, connection) {
	if (puppets[userId] && puppets[userId][connection])
		return puppets[userId][connection];
	return null;
}