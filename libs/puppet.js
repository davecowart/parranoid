var irc = require('irc');
var bot, screenname;

module.exports.init = function(user, connection, clientManager, channels, connected) {
	bot = new irc.Client(connection, user.irc_username, {
		channels: channels || []
	});

	bot.addListener('message', function(from, to, message) {
		//TODO: log to database
		console.log('received a generic message from %s to %s: %s', from, to, message);
	});

	bot.addListener('registered', function(message) {
		screenname = message.args[0];

		emit('registered', { connection: connection, screenname: screenname }, clientManager, user._id);
	});

	bot.addListener('raw', function(message) {
		if (message.command === 'QUIT') {
			emit('quit', { connection: connection }, clientManager, user._id);
		}
	});

	bot.addListener('join', function(channel, nick, message) {
		console.log('%s joined %s', nick, channel);
		if (nick === screenname) {
			bot.addListener('message' + channel, function(from, message) {
				//TODO: pass in a listener from the user of this module (that emits the message on a socket)
				console.log('received a channel message in %s from %s: %s', channel, from, message);
			});
		}
		//TODO: emit bot.chans over a socket to update the client			
		console.log('updating client status:');
		console.log(bot.chans);
	});

	return this;
};

module.exports.connect = function() {
	bot.connect();
};

module.exports.quit = function() {
	bot.disconnect('Later!');
};

function emit(event, data, clientManager, userId) {
	console.log('emitting ' + event);
	var cc = clientManager.connectedClients[userId];
	for (var i = cc.length - 1; i >= 0; i--) {
		clientManager.clients[cc[i]].emit(event, data);
	}
}