var puppet = require('./puppet');
var puppets = {}; //an organized crate of puppets
var puppetLogger, userLogger;

module.exports.init = function(plogger, ulogger) {
	puppetLogger = plogger;
	userLogger = ulogger;
};

module.exports.connect = function(user, connection, connectionManager, channels, done) {
	initializePuppet(user, connectionManager, connection, channels, done);
};

module.exports.puppets = function() {
	return puppets;
};

module.exports.getLogger = function() {
	return puppetLogger;
};

module.exports.loadAtAppStart = function(connectionManager) {
	initializeUsers(connectionManager);
};

function initializeUsers(connectionManager) {
	var callback = function(users) {
		for (var i = users.length - 1; i >= 0; i--) {
			initializePuppets(users[i], connectionManager);
		}
	};
	userLogger.getUsers(callback);
}

function initializePuppet(user, connectionManager, connection, channels, done) {
	var dummy = getDummy(user._id, connection);
	if (!dummy) {
		dummy = puppet.init(user, connection, connectionManager, channels, puppetLogger, done, function() {
			delete puppets[user._id][connection];
		});
		if (!puppets[user._id])
			puppets[user._id] = {};
		puppets[user._id][connection] = dummy;
	} else {
		dummy.connect();
		if (done) done();
	}
}

function initializePuppets(user, connectionManager) {
	var callback = function(connections) {
		for (var i = connections.length - 1; i >= 0; i--) {
			initializePuppet(user, connectionManager, connections[i].connection, connections[i].channels);
		}
	};
	puppetLogger.loadState(user, callback);
}

function getDummy(userId, connection) {
	if (puppets[userId] && puppets[userId][connection])
		return puppets[userId][connection];
	return null;
}