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

function MessageViewModel(data) {
	var self = this;
	self.nick = data.nick || '';
	self.timestamp = data.timestamp || Date.now();
	self.text = data.text || '';
}

function ClientViewModel(theSocket) {
	var self = this;
	self.servers = ko.observableArray([]);
	self.socket = theSocket;

	self.roomList = ko.computed(function() {
		return _.flatten(_.map(self.servers(), function(server) { return server.rooms(); }));
	});

	self.socket.on('message', function(data) {
		var server = self.findServer(data.connection);
		var room = self.findRoom(data.connection, data.channel);
		var message = new MessageViewModel(data);
		room.messages.push(message);
	});

	self.socket.on('connect', function() {
		$.post('/client/connect', { socketid: this.socket.sessionid });
	});

	self.socket.on('registered', function(data) {
		var server = new ServerViewModel();
		server.connection(data.connection);
		server.screenname(data.screenname);
		//need to load any rooms that were previously connected
		self.servers.push(server);
	});

	self.socket.on('quit', function(data) {
		self.servers.remove(self.findServer(data.connection));
	});

	self.socket.on('join', function(data) {
		var server = self.findServer(data.connection);
		var room = _.find(server.rooms(), function(room) { return room.name() === data.channel && room.connection() === data.connection; });
		room.users.push(data.nick);
	});

	self.socket.on('part', function(data) {
		var room = self.findRoom(data.connection, data.channel);
		room.users.remove(data.nick);
	});

	self.socket.on('joinRoom', function(data) {
		var server = self.findServer(data.connection);
		var room = self.findRoom(data.connection, data.channel);
		if (room !== undefined) return;
		room = new RoomViewModel();
		room.name(data.channel);
		room.connection(data.connection);
		room.users(data.chan.users);
		//need to load all users and messages
		server.rooms.push(room);
	});

	self.socket.on('partRoom', function(data) {
		var server = self.findServer(data.connection);
		var room = self.findRoom(data.connection, data.channel);
		server.rooms.remove(room);
	});

	self.socket.on('users', function(data) {
		var room = self.findRoom(data.connection, data.channel);
		if (room === undefined) return;
		room.users(data.users);
	});

	self.findServer = function(connection) {
		return _.find(self.servers(), function(server) { return server.connection() === connection; });
	};

	self.findRoom = function(connection, channel) {
		var server = self.findServer(connection);
		return _.find(server.rooms(), function(room) { return room.name() === channel && room.connection() === connection; });
	};

	self.addServer = function(serverConnection) {
		var connection = serverConnection.connection || prompt('New Connection', 'irc.freenode.net');
		if (!connection) return;

		self.socket.emit('connectServer', { connection: connection });
	};

	self.removeServer = function(server) {
		self.socket.emit('removeServer', { connection: server.connection() });
	};

	self.joinRoom = function() {
		var roomInput = $('#join-room');
		var channel = roomInput.val();
		if (_.any(self.roomList(), function(room) { return room.name() === channel; })) {
			roomInput.val('');
			return;
		}
		self.socket.emit('join', { connection: $('#join-server').val(), channel: channel });
	};

	self.partRoom = function(room) {
		self.socket.emit('part', { connection: room.connection(), channel: room.name() });
	};

	self.roomList.subscribe(function() {
		console.log('refreshing tabs');
		setTimeout(function() { $('#rooms').tabs('destroy').tabs(); }, 50);
	});
}












