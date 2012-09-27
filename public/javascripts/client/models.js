function ServerViewModel() {
	var self = this;
	self.connection = ko.observable();
	self.rooms = ko.observableArray([]);

	self.joinRoom = function(roomName, done) {
		var room = new RoomViewModel();
		room.name(roomName);
		room.connection(self.connection());
		self.rooms.push(room);
		$('#rooms').tabs('destroy').tabs();
	};
}

function RoomViewModel() {
	var self = this;
	self.users = ko.observableArray([]);
	self.messages = ko.observableArray([]);
	self.name = ko.observable();
	self.topic = ko.observable();
	self.connection = ko.observable();
	self.identifier = ko.computed(function() {
		var id = 'tabs-' + self.connection() + '-' + self.name();
		return id.replace(/[^a-zA-Z0-9]+/g, '_');
	});
}

function MessageViewModel() {
	var self = this;
	self.room = '';
	self.timestamp = '';
	self.message = '';
}

function ClientViewModel() {
	var self = this;
	self.servers = ko.observableArray([]);

	self.roomList = ko.computed(function() {
		return _.flatten(_.map(self.servers(), function(server) { return server.rooms(); }));
	});

	self.addServer = function(serverConnection, done) {
		var connection = serverConnection.connection || prompt('New Connection', 'irc.freenode.net');
		if (!connection) return;

		//TODO: put this in response of an ajax call
		var server = new ServerViewModel();
		server.connection(connection);
		self.servers.push(server);
		if (done) done();
	};
}