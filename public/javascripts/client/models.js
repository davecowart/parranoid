function ServerViewModel() {
	var self = this;
	self.connection = ko.observable();
	self.rooms = ko.observableArray([]);
	self.privateMessages = ko.observableArray([]);
	self.screenname = ko.observable();
	self.topic = ko.observable();

	self.joinRoom = function(roomName, done) {
		var room = new RoomViewModel();
		room.name(roomName);
		room.connection(self.connection());
		self.rooms.push(room);
		$('#rooms').tabs('destroy').tabs();
		if (done) done();
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

function PrivateMessageViewModel() {
	var self = this;
	self.messages = ko.observableArray([]);
	self.name = ko.observable();
	self.connection = ko.observable();
	self.identifier = ko.computed(function() {
		var id = 'tabs-' + self.connection() + '-pm-' + self.name();
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

	self.pmList = ko.computed(function() {
		return _.flatten(_.map(self.servers(), function(server) { return server.privateMessages(); }));
	});

	self.socket.on('message', function(data) {
		var server = self.findServer(data.connection);
		var message = new MessageViewModel(data);
		var room = self.findRoom(data.connection, data.channel);
		if (room) {
			room.messages.push(message);
		} else {
			var privateMessage = self.findPrivateMessage(data.connection, data.channel);
			if (!privateMessage) {
				privateMessage = new PrivateMessageViewModel();
				privateMessage.connection(data.connection);
				privateMessage.name(data.channel);
				server.privateMessages.push(privateMessage);
			}
			privateMessage.messages.push(message);
		}
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
		if (server === undefined) return;
		var room = _.find(server.rooms(), function(room) { return room.name() === data.channel && room.connection() === data.connection; });
		if (room === undefined) return;
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
		if (server === undefined) return;
		var room = self.findRoom(data.connection, data.channel);
		if (room === undefined) return;
		server.rooms.remove(room);
	});

	self.socket.on('users', function(data) {
		var room = self.findRoom(data.connection, data.channel);
		if (room === undefined) return;
		room.users(data.users);
	});

	self.socket.on('topic', function(data) {
		var room = self.findRoom(data.connection, data.channel);
		if (room === undefined) return;
		room.topic(data.topic);
	});

	self.findServer = function(connection) {
		return _.find(self.servers(), function(server) { return server.connection() === connection; });
	};

	self.findRoom = function(connection, channel) {
		var server = self.findServer(connection);
		if (server === undefined) return;
		return _.find(server.rooms(), function(room) { return room.name() === channel && room.connection() === connection; });
	};

	self.findPrivateMessage = function(connection, name) {
		var server = self.findServer(connection);
		if (server === undefined) return;
		return _.find(server.privateMessages(), function(pm) { return pm.name() === name && pm.connection() === connection; });
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
		roomInput.val('');
		if (_.any(self.roomList(), function(room) { return room.name() === channel; })) return;
		self.socket.emit('join', { connection: $('#join-server').val(), channel: channel });
	};

	self.keyupJoinRoom = function(data, event) {
		if (event.keyCode !== 13) return;
		self.joinRoom();
	};

	self.partRoom = function(room) {
		self.socket.emit('part', { connection: room.connection(), channel: room.name() });
	};

	self.addPrivateMessage = function(connection, nick) {
		var pm = new PrivateMessageViewModel();
		pm.name(nick);
		pm.connection(connection);
		var server = self.findServer(connection);
		if (server)
			server.privateMessages.push(pm);
	};

	self.closePrivateMessage = function(pm) {
		var server = self.findServer(pm.connection());
		server.privateMessages.remove(pm);
	};

	self.clearMessages = function(room) {
		room.messages.removeAll();
	};

	self.sendMessage = function(room) {
		var input = $('#msg_' + room.identifier());
		if (input.val() === '') return;
		var server = self.findServer(room.connection());
		self.socket.emit('message', { connection: room.connection(), channel: room.name(), text: input.val() });
		input.val('');
	};

	self.keyupSendMessage = function(room, event) {
		if (event.keyCode !== 13) return;
		self.sendMessage(room);
	};

	self.roomList.subscribe(function(rooms) {
		setTimeout(function() { $('#rooms').tabs('destroy').tabs().tabs('select', rooms.length - 1); }, 100);
		if (rooms.length > 0)
			catchup();
	});

	self.pmList.subscribe(function(privateMessages) {
		setTimeout(function() { $('#rooms').tabs('destroy').tabs(); });
	});
}












