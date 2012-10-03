var irc = require('irc');
var _ = require('underscore');
var bot, screenname;
var puppetLogger;
var owner, server;
var puppet = this;

module.exports.init = function(user, connection, clientManager, channels, logger, connected) {
	puppetLogger = logger;
	owner = user;
	server = connection;

	bot = new irc.Client(connection, user.irc_username, {
		channels: channels || []
	});

	bot.addListener('message', function(nick, to, text, message) {
		puppetLogger.logMessage(user, connection, to, nick, text);
		console.log('received a generic message from %s to %s: %s', nick, to, text);
		emit('message', { connection: connection, channel: to, nick: nick, to: to, text: text }, clientManager, user._id);
	});

	bot.addListener('registered', function(message) {
		screenname = message.args[0];
		emit('registered', { connection: connection, screenname: screenname }, clientManager, user._id);
		puppetLogger.savePuppetState(user, puppet);
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
			puppetLogger.savePuppetState(user, puppet);
		} else {
			emit('join', { connection: connection, channel: channel, nick: nick }, clientManager, user._id);
		}
	});

	bot.addListener('part', function(channel, nick, reason, message) {
		if (nick === screenname) {
			var output = { connection: connection, channel: channel };
			emit('partRoom', output, clientManager, user._id);
			puppetLogger.savePuppetState(user, puppet);
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

module.exports.messages = function(callback) {
	var output = {};
	console.log(bot.chans);
	console.log(_.keys(bot.chans));
	var channels = _.keys(bot.chans);
	console.log(channels);

	var gatherer = _.after(channels.length, function() {
		callback(server, output);
	});

	var gatherMessages = function(channel, messages) {
		console.log(messages);
		output[channel] = messages;
		console.log('calling puppet.gatherer');
		gatherer();
	};

	for (var i = channels.length - 1; i >= 0; i--) {
		console.log('calling retrieveMessages');
		var messages = puppetLogger.retrieveMessages(owner, server, channels[i], gatherMessages);
	}
};

function emit(event, data, clientManager, userId) {
	console.log('emitting ' + event);
	var cc = clientManager.connectedClients[userId];
	for (var i = cc.length - 1; i >= 0; i--) {
		clientManager.clients[cc[i]].emit(event, data);
	}
}