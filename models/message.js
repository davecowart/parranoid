module.exports = function(mongoose) {
	var modelObject = {};
	var Schema = mongoose.Schema,
			ObjectId = Schema.ObjectId;

	var MessageSchema = new Schema({
		owner: ObjectId,
		connection: String,
		channel: String,
		sender: String,
		message: String,
		timestamp: Date
	});

	modelObject.MessageSchema = MessageSchema;
	modelObject.Message = mongoose.model('message', MessageSchema);
	return modelObject;
}