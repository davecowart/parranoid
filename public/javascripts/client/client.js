var clientViewModel;

function refresh() {
	$.get('/client/refresh', function(data) {
		clientViewModel.servers.removeAll();
		for (var i = data.length - 1; i >= 0; i--) {
			var server = new ServerViewModel();
			server.connection(data[i].server.connection);
			server.screenname(data[i].server.nick);
			var channels = _.keys(data[i].chans);

			for (var j = channels.length - 1; j >= 0; j--) {
				var room = new RoomViewModel();
				var channel = data[i].chans[channels[j]];
				room.name(channel.key);
				room.connection(data[i].server.connection);
				room.users(_.keys(channel.users));
				server.rooms.push(room);
			}
			clientViewModel.servers.push(server);
		}
		$('#rooms').tabs('destroy').tabs();
	});
}

$(function() {
	var socket = io.connect('http://localhost');
	clientViewModel = new ClientViewModel(socket);
	ko.applyBindings(clientViewModel);
	$('#rooms').tabs();
	refresh();
});