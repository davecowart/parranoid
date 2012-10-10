var _ = require('underscore');

module.exports = function (app, service, puppeteer, server, connectionManager) {
	var user = service.useModel('user').User;
	// var connection = service.useModel('connection').Connection;

	app.get('/admin', ensureAuthenticated, function(req, res) {
		user.find(function(err, users) {
			res.render('admin/index', { 
				current_user: { email: req.user.email }, 
				users: users 
			});
		});
	});

	app.get('/admin/:userId', ensureAuthenticated, function(req, res) {
		user.findOne({_id: req.params.userId}, function(err, user) {
			if (!user)
				res.redirect('/admin');

			var connections = [];
			var puppets = puppeteer.puppets()[req.params.userId];
			if (puppets)
				connections = _.keys(puppets);

			var sockets = connectionManager.connectedClients()[req.params.userId] || [];
			var clients = [];

			for (var i = sockets.length - 1; i >= 0; i--) {
				var socketId = sockets[i];
				clients.push(connectionManager.clients()[socketId]);
			}

			res.render('admin/user', {
				current_user: { email: req.user.email },
				user: { _id: user._id, email: user.email },
				puppets: puppets,
				connections: connections,
				sockets: sockets,
				clients: clients
			});
		});
	});

	app.get('/admin/:userId/:connection', ensureAuthenticated, function(req, res) {
		user.findOne({_id: req.params.userId}, function(err, user) {
			if (!user)
				res.redirect('/admin');

			var puppet = puppeteer.puppets()[req.params.userId][req.params.connection];

			res.render('admin/puppet', {
				current_user: { email: req.user.email },
				user: { _id: user._id, email: user.email },
				puppet: puppet
			});

		});
	});

	app.post('/admin/:userId/:connection/kill', ensureAuthenticated, function(req, res) {
		var userId = req.params.userId;
		var connection = req.params.connection;

		if (!userId || !connection) {
			respondWithJson(res, false);
			return;
		}

		var puppets = puppeteer.puppets()[userId];
		if (!puppets || puppets.length === 1) {
			respondWithJson(res, false);
			return;
		}

		var puppet = puppets[connection];
		if (!puppet) {
			respondWithJson(res, false);
			return;
		}

		puppet.quit();

		respondWithJson(res, true);
	});

	function ensureAuthenticated(req, res, next) {
		//TODO: implement roles
		if (req.isAuthenticated() && req.user.email === 'davecowart@gmail.com') { return next(); }
		res.redirect('/login?returnUrl=%2fadmin');
	}

	function respondWithJson(res, object) {
		if (typeof object === "boolean") object = { success : object };
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.write(JSON.stringify(object || { success: true }));
		res.end();
	}
};