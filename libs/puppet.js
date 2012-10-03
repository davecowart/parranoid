var irc = require('irc');
var _ = require('underscore');
var bot, screenname;
var puppetLogger;
var owner, server;
var puppet = this;

module.exports.init = function(user, connection, connectionManager, channels, logger, connected, suicide) {
	puppetLogger = logger;
	owner = user;
	server = connection;

	bot = new irc.Client(connection, user.irc_username, {
		channels: channels || []
	});

	bot.addListener('message', function(nick, to, text, message) {
		puppetLogger.logMessage(user, connection, to, nick, text);
		emit('message', { connection: connection, channel: to, nick: nick, to: to, text: text }, connectionManager, user._id);
	});

	bot.addListener('registered', function(message) {
		screenname = message.args[0];
		emit('registered', { connection: connection, screenname: screenname }, connectionManager, user._id);
		//puppetLogger.savePuppetState(user, puppet);
	});

	bot.addListener('raw', function(message) {
		if (message.command === 'QUIT') {
			emit('quit', { connection: connection }, connectionManager, user._id);
			puppetLogger.removePuppetState(user, connection);
			if (suicide) suicide();
		} else if (message.command === 'rpl_namreply') {
			var users = message.args[3].split(' ');
			emit('users', { connection: connection, channel: message.args[2], users: users }, connectionManager, user._id);
		} else {
			//console.log(message.command);
		}
	});

	bot.addListener('join', function(channel, nick, message) {
		if (nick === screenname) {
			var output = { connection: connection, channel: channel, chan: _.find(bot.chans, function(chan) { return chan.key === channel; }) };
			emit('joinRoom', output, connectionManager, user._id);
			puppetLogger.savePuppetState(user, puppet);
		} else {
			emit('join', { connection: connection, channel: channel, nick: nick }, connectionManager, user._id);
		}
	});

	bot.addListener('part', function(channel, nick, reason, message) {
		if (nick === screenname) {
			var output = { connection: connection, channel: channel };
			emit('partRoom', output, connectionManager, user._id);
			puppetLogger.savePuppetState(user, puppet);
		} else {
			emit('part', { connection: connection, channel: channel, nick: nick, reason: reason }, connectionManager, user._id);
		}
	});

	return this;
};

module.exports.connect = function() {
	bot.connect();
};

module.exports.quit = function() {
	bot.disconnect('Later!');
};

module.exports.join = function(channel) {
	bot.join(channel);
};

module.exports.part = function(channel) {
	bot.part(channel);
};

module.exports.message = function(channel, text) {
	puppetLogger.logMessage(owner, server, channel, screenname, text);
	bot.say(channel, text);
};

module.exports.channels = function() {
	return bot.chans;
};

module.exports.opt = function() {
	return bot.opt;
};

module.exports.messages = function(callback) {
	var output = {};
	var channels = _.keys(bot.chans);

	var gatherer = _.after(channels.length, function() {
		callback(server, output);
	});

	var gatherMessages = function(channel, messages) {
		output[channel] = messages;
		gatherer();
	};

	for (var i = channels.length - 1; i >= 0; i--) {
		var messages = puppetLogger.retrieveMessages(owner, server, channels[i], gatherMessages);
	}
};

function emit(event, data, connectionManager, userId) {
	var cc = connectionManager.connectedClients()[userId];
	if (!cc) return;
	for (var i = cc.length - 1; i >= 0; i--) {
		connectionManager.clients()[cc[i]].emit(event, data);
	}
}