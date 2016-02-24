var mongoose = require("mongoose");
var mongoosastic = require("mongoosastic");

var Schema = mongoose.Schema;

var gameSchema = new Schema({
	owner: {type: Schema.Types.ObjectId, ref: "User"}, //refer to the existing users in mongodb
	category: {type: Schema.Types.ObjectId, ref: "Category"},//replicate the objectId of an existing mongo document!!
	name: {type: String, required: true},
	language: {type: String},
	pricePaid: {type: Number},
	yearPublished: {type: Number},
	genre: {type: String, required: true},
	image: {type: String},
	postingData: [{
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