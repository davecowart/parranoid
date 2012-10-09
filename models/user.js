module.exports = function(mongoose) {
	var modelObject = {};
	var Schema = mongoose.Schema,
			ObjectId = Schema.ObjectId;

	var UserSchema = new Schema({
		email: String,
		hashword: String,
		salt: String,
		irc_username: String,
		irc_password: String
	});

	modelObject.UserSchema = UserSchema;
	modelObject.User = mongoose.model('user', UserSchema);
	return modelObject;
};