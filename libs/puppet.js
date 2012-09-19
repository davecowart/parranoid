var irc = require('irc');
var bot, screenname;

module.exports.init = function(screenname, connection, channels, connected) {
	bot = new irc.Client(connection, screenname, {
		channels: channels || []
	});

	bot.addListener('message', function(from, to, message) {
		//TODO: log to database
		console.log('received a generic message from %s to %s: %s', from, to, message);
	});

	bot.addListener('registered', function(message) {
		console.log('logged in');
		screenname = message.args[0];
		//TODO: emit screenname over a socket to update the client
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
