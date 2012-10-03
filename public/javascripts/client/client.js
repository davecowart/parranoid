var clientViewModel;

function refresh() {
	$.get('/client/refresh', function(data) {
		clientViewModel.servers.removeAll();
		for (var i = data.length - 1; i >= 0; i--) {
			var server = new ServerViewModel();
			server.connection(data[i].server.server);
			server.screenname(data[i].server.nick);
			var channels = _.keys(data[i].chans);

			for (var j = channels.length - 1; j >= 0; j--) {
				var room = new RoomViewModel();
				var channel = data[i].chans[channels[j]];
				room.name(channel.key);
				room.connection(data[i].server.server);
				room.users(_.keys(channel.users));
				server.rooms.push(room);
			}
			clientViewModel.servers.push(server);
		}
		$('#rooms').tabs('destroy').tabs();
	});
}

function catchup() {
	$.get('/client/catchup', function(data) {
		for (var i = clientViewModel.servers().length - 1; i >= 0; i--) {
			var clientServer = clientViewModel.servers()[i];
			var catchup = _.find(data, function(item) { return item.connection === clientServer.connection(); });
			for (var j = clientServer.rooms().length - 1; j >= 0; j--) {
				var clientRoom = clientServer.rooms()[j];
				var messages = catchup.messages[clientRoom.name()];
				clientRoom.messages.removeAll();
				for (var k = 0; k < messages.length; k++) {
					clientRoom.messages.push(new MessageViewModel({nick: messages[k].from, timestamp: messages[k].timstamp, text: messages[k].message}));
				}
			}
		}
	});
}

$(function() {
	var socket = io.connect('/');
	clientViewModel = new ClientViewModel(socket);
	ko.applyBindings(clientViewModel);
	$('#rooms').tabs();
	refresh();
});