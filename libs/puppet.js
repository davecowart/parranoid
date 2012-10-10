var irc = require('irc');
var _ = require('underscore');

module.exports.init = function(user, connection, connectionManager, channels, logger, connected, suicide) {
	var puppetLogger = logger;
	var self = this;
	var screenname;

	var bot = new irc.Client(connection, user.irc_username, {
		channels: channels || [],
		userName: user.irc_username,
		realName: user.irc_username + ' - on Parranoid IRC client'
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
			//console.log(message);
		}
	});

	bot.addListener('join', function(channel, nick, message) {
		if (nick === screenname) {
			var output = { connection: connection, channel: channel, chan: _.find(bot.chans, function(chan) { return chan.key === channel; }) };
			emit('joinRoom', output, connectionManager, user._id);
			puppetLogger.savePuppetState(user, self);
		} else {
			emit('join', { connection: connection, channel: channel, nick: nick }, connectionManager, user._id);
		}
	});

	bot.addListener('part', function(channel, nick, reason, message) {
		if (nick === screenname) {
			var output = { connection: connection, channel: channel };
			emit('partRoom', output, connectionManager, user._id);
			puppetLogger.savePuppetState(user, self);
		} else {
			emit('part', { connection: connection, channel: channel, nick: nick, reason: reason }, connectionManager, user._id);
		}
	});

	bot.addListener('topic', function(channel, topic, nick, message) {
		var output = { connection: connection, channel: channel, nick: nick, topic: topic };
		emit('topic', output, connectionManager, user._id);
	});

	self.connect = function() {
		bot.connect();
	};

	self.quit = function() {
		bot.disconnect('Later!');
	};

	self.join = function(channel) {
		bot.join(channel);
	};

	self.part = function(channel) {
		bot.part(channel);
	};

	self.message = function(channel, text) {
		if (!text || text === '') return;
		puppetLogger.logMessage(user, connection, channel, screenname, text);
		bot.say(channel, text);
		emit('message', { connection: connection, channel: channel, nick: screenname, to: channel, text: text }, connectionManager, user._id);
	};

	self.connection = function() {
		return bot.opt.server;
	};

	self.channels = function() {
		return bot.chans;
	};

	self.opt = function() {
		return bot.opt;
	};

	self.messages = function(callback) {
		var output = {};
		var channels = _.keys(bot.chans);

		var gatherer = _.after(channels.length, function() {
			callback(connection, output);
		});

		var gatherMessages = function(channel, messages) {
			output[channel] = messages;
			gatherer();
		};

		for (var i = channels.length - 1; i >= 0; i--) {
			var messages = puppetLogger.retrieveMessages(user, connection, channels[i], gatherMessages);
		}
	};

	if (connected)
		connected(self);
	return self;
};

function emit(event, data, connectionManager, userId) {
	var cc = connectionManager.connectedClients()[userId];
	if (!cc) return;
	for (var i = cc.length - 1; i >= 0; i--) {
		connectionManager.clients()[cc[i]].emit(event, data);
	}
}