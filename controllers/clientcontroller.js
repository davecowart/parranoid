module.exports = function (app, service, puppeteer, http) {
	app.get('/client', ensureAuthenticated, function(req, res) {
		res.render('client/index', {user: req.user });
	});

	function ensureAuthenticated(req, res, next) {
		if (req.isAuthenticated()) { return next(); }
		res.redirect('/login?returnUrl=%2fclient');
	}
};