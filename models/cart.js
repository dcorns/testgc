var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var cartSchema = new Schema({
	owner: {type: Schema.Types.ObjectId, ref: "User"}, //refer to the existing users in mongodb
	total: {type: Number, default: 0},
	items: [{
		item: {type: Schema.Types.ObjectId, ref: "Product"}, //refer to the existing products in mongodb
		quantity: {type: Number, default: 1},
		price: {type: Number, default: 0},
	}]
});

module.exports = mongoose.model("Cart", cartSchema);