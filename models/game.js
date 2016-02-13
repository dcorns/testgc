var mongoose = require("mongoose");
var mongoosastic = require("mongoosastic");

var Schema = mongoose.Schema;

var gameSchema = new Schema({
	//_id: mongo creates a self-generated id for every new db record, in this case, user.
	owner: {type: Schema.Types.ObjectId, ref: "User"}, //refer to the existing users in mongodb
	name: {type: String, required: true},
	condition: {type: String, required: true},
	pricePaid: {type: Number},
	language: {type: String},
	yearPublished: {type: Number},
	genre: {type: String, required: true},
	image: {type: String}
});

gameSchema.plugin(mongoosastic, {
	hosts: [
		"localhost:9200" //the default port number for local hosting on elastic search
	]
}); //with mongoosastic, we can use Product.search, Product.createMapping, etc. cool search functionality.

module.exports = mongoose.model("Game", gameSchema);