var fs = require('fs');

module.exports = function(app, service, puppeteer, server, connectionManager) {
	fs.readdir(__dirname + '/../controllers', function(err, files) {
		if (err) throw err;
		files.forEach(function(file) {
			var name = file.replace('.js', '');
			require('./../controllers/' + name)(app, service, puppeteer, server, connectionManager);
		});
	});
};