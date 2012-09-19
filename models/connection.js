module.exports = function(mongoose) {
	var modelObject = {};
	var Schema = mongoose.Schema,
			ObjectId = Schema.ObjectId;

	var ConnectionSchema = new Schema({
		owner: ObjectId,
		connection: String,
		channels: [String]
	});

	modelObject.ConnectionSchema = ConnectionSchema;
	modelObject.Connection = mongoose.model('connection', ConnectionSchema);
	return modelObject;
};