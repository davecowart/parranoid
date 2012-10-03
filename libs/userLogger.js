var _ = require('underscore');
var userModel;
//var ObjectId = require('mongoose').Types.ObjectId;

module.exports.init = function(service) {
	userModel = service.useModel('User');
};

module.exports.getUsers = function(callback) {
	userModel.User.find(function(err, users) {
		callback(users);
	});
};
