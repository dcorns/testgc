var mongoose = require("mongoose");
var mongoosastic = require("mongoosastic");

var Schema = mongoose.Schema;

var gameSchema = new Schema({
	name: {type: String, required: true},
	language: {type: String},
	genre: {type: String, required: true},
	image: {type: String},
	postingData: [{
		owner: {type: Schema.Types.ObjectId, ref: "User"}, //refer to the existing users in mongodb
		datePosted: {type: Date, default: Date.now},
		quantity: {type: Number, default: 1}
	}]
});

gameSchema.plugin(mongoosastic, {
	hosts: [
		"localhost:9200" //the default port number for local hosting on elastic search
	]
}); //with mongoosastic, we can use Product.search, Product.createMapping, etc. cool search functionality.

module.exports = mongoose.model("Game", gameSchema);