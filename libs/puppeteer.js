var puppet = require('./puppet');
var puppets = {}; //an organized crate of puppets
var puppetLogger, userLogger;

module.exports.init = function(plogger, ulogger) {
	puppetLogger = plogger;
	userLogger = ulogger;
};

module.exports.connect = function(user, connection, connectionManager, channels, done) {
	var userId = user._id;
	console.log('getting dummy');
	var dummy = getDummy(userId, connection);
	console.log('got dummy');
	if (!dummy) {
		console.log('initing');
		dummy = puppet.init(user, connection, connectionManager, channels, puppetLogger, done);
		console.log(dummy);
		if (!puppets[userId])
			puppets[userId] = {};
		puppets[userId][connection] = dummy;
	} else {
		console.log('connecting');
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

function initializePuppets(user, connectionManager) {
	var callback = function(connections) {
		for (var i = connections.length - 1; i >= 0; i--) {
			var connection = connections[i];
			var dummy = getDummy(user._id, connection.connection);
			if (!dummy) {
				dummy = puppet.init(user, connection.connection, connectionManager, connection.channels, puppetLogger);
				if (!puppets[user._id])
					puppets[user._id] = {};
				puppets[user._id][connection.connection] = dummy;
			} else {
				dummy.connect();
			}
		}
	};
	puppetLogger.loadState(user, callback);
}

function getDummy(userId, connection) {
	if (puppets[userId] && puppets[userId][connection])
		return puppets[userId][connection];
	return null;
}