var _ = require('underscore');
var userModel;

module.exports.init = function(service) {
	userModel = service.useModel('user');
};

module.exports.getUsers = function(callback) {
	userModel.User.find(function(err, users) {
		callback(users);
	});
};
