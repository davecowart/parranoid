var irc = require('irc');
var _ = require('underscore');
var bot, screenname;
var puppetLogger;
var owner, server;

module.exports.init = function(user, connection, clientManager, channels, logger, connected) {
	puppetLogger = logger;
	owner = user;
	server = connection;

	bot = new irc.Client(connection, user.irc_username, {
		channels: channels || []
	});

	bot.addListener('message', function(nick, to, text, message) {
		puppetLogger.logMessage(user, connection, to, nick, text);
		//TODO: log to database
		console.log('received a generic message from %s to %s: %s', nick, to, text);
		emit('message', { connection: connection, channel: to, nick: nick, to: to, text: text }, clientManager, user._id);
	});

	bot.addListener('registered', function(message) {
		screenname = message.args[0];
		emit('registered', { connection: connection, screenname: screenname }, clientManager, user._id);
	});

	bot.addListener('raw', function(message) {
		if (message.command === 'QUIT') {
			emit('quit', { connection: connection }, clientManager, user._id);
		} else if (message.command === 'rpl_namreply') {
			var users = message.args[3].split(' ');
			emit('users', { connection: connection, channel: message.args[2], users: users }, clientManager, user._id);
		} else {
			console.log(message.command);
		}
	});

	bot.addListener('join', function(channel, nick, message) {
		if (nick === screenname) {
			var output = { connection: connection, channel: channel, chan: _.find(bot.chans, function(chan) { return chan.key === channel; }) };
			emit('joinRoom', output, clientManager, user._id);
		} else {
			emit('join', { connection: connection, channel: channel, nick: nick }, clientManager, user._id);
		}
	});

	bot.addListener('part', function(channel, nick, reason, message) {
		if (nick === screenname) {
			var output = { connection: connection, channel: channel };
			emit('partRoom', output, clientManager, user._id);
		} else {
			emit('part', { connection: connection, channel: channel, nick: nick, reason: reason }, clientManager, user._id);
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

function emit(event, data, clientManager, userId) {
	console.log('emitting ' + event);
	var cc = clientManager.connectedClients[userId];
	for (var i = cc.length - 1; i >= 0; i--) {
		clientManager.clients[cc[i]].emit(event, data);
	}
}