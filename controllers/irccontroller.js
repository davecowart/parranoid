var crypto = require('crypto');

module.exports = function (app, service) {
	var model = service.useModel('user');

	app.get('/credentials', ensureAuthenticated, function(req, res) {
		res.render('irc/credentials', { current_user: { email: req.user.email, irc_username: req.user.irc_username} });
	});

	app.post('/credentials', ensureAuthenticated, function(req, res) {
		model.User.findById(req.user._id, function(err, user) {
			user.irc_username = req.param('irc_username');

			var password = req.param('irc_password');
				if (password !== '__default' && password !== '') {
				var algorithm = 'aes256';
				var key = process.env.CRYPTO_KEY || 'crypto';
				var cipher = crypto.createCipher(algorithm, key);
				var encrypted = cipher.update(password, 'utf8', 'hex') + cipher.final('hex');
				user.irc_password = encrypted;
			}

			user.save(function(err) {
				if (err) {
					console.log(err);
					console.trace();
				}
				res.redirect('/');
			});
		});
	});

	function ensureAuthenticated(req, res, next) {
		if (req.isAuthenticated()) { return next(); }
		res.redirect('/login?returnUrl=%2fcredentials');
	}
};