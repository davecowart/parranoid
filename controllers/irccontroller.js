module.exports = function (app, service) {
	var model = service.useModel('user');

	app.get('/credentials', ensureAuthenticated, function(req, res) {
		res.render('irc/credentials', { user: req.user });
	});

	app.post('/credentials', ensureAuthenticated, function(req, res) {
		model.User.findById(req.user._id, function(err, user) {
			user.irc_username = req.param('irc_username');
			user.irc_password = req.param('irc_password');
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