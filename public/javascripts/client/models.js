function ServerViewModel() {
	var self = this;
	self.connection = ko.observable();
	self.rooms = ko.observableArray([]);
	self.screenname = ko.observable();

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

function ClientViewModel(theSocket) {
	var self = this;
	self.servers = ko.observableArray([]);
	self.socket = theSocket;

	self.roomList = ko.computed(function() {
		return _.flatten(_.map(self.servers(), function(server) { return server.rooms(); }));
	});

	self.socket.on('connect', function() {
		$.post('/client/connect', { socketid: this.socket.sessionid });
	});

	self.socket.on('registered', function(data) {
		var server = new ServerViewModel();
		server.connection(data.connection);
		server.screenname(data.screenname);
		self.servers.push(server);
	});

	self.addServer = function(serverConnection) {
		var connection = serverConnection.connection || prompt('New Connection', 'irc.freenode.net');
		if (!connection) return;

		self.socket.emit('connectServer', { connection: 'irc.freenode.net' });
	};

	self.removeServer = function(server) {
		//TODO: put this in socket listener
		// self.servers.remove(server);
	};

	self.joinRoom = function() {
		var roomInput = $('#join-room');
		var channel = roomInput.val();
		if (_.any(self.roomList(), function(room) { return room.name() === channel; })) {
			roomInput.val('');
			return;
		}

		var connection = $('#join-server').val();

		//TODO: put this in socket listener
		// var selectedConnection = _.find(self.servers(), function(server) { return server.connection() === connection; });
		// var room = new RoomViewModel();
		// room.name(channel);
	};
}












