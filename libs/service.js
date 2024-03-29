var environment;
var mongoose = require('mongoose');

module.exports.init = function(env) {
	environment = env;
};

module.exports.useModel = function(modelName) {
	var checkConnectionExists = (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2);
	if (!checkConnectionExists) { mongoose.connect(environment.db.URL); }
	return require('./../models/' + modelName)(mongoose);
};
