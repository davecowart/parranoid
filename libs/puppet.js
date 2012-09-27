var irc = require('irc');
var bot, screenname, socketManager;

module.exports.init = function(user, connection, clientManager, channels, connected) {
	console.log('creating puppet');
	bot = new irc.Client(connection, user.irc_username, {
		channels: channels || ['#ix2-bot']
	});

	socketManager = clientManager;

	bot.addListener('message', function(from, to, message) {
		//TODO: log to database
		console.log('received a generic message from %s to %s: %s', from, to, message);
	});

	bot.addListener('registered', function(message) {
		screenname = message.args[0];
		
		//emit connection and screenname over a socket to update all clients
		var cc = clientManager.connectedClients[user._id];
		for (var i = cc.length - 1; i >= 0; i--) {
			var socketId = cc[i];
			var socket = clientManager.clients[socketId];
			socket.emit('registered', { connection: connection, screenname: screenname });
		}

		if (connected)
			connected();
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

	return bot;
};
