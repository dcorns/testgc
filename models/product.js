var mongoose = require("mongoose");
var mongoosastic = require("mongoosastic");//a library that uses elastic search to replicate the data, from mongodb,
//so you can search for specific data using mongosastic features, without requiring to write additional
//code to connect elastic to mongodb.

var Schema = mongoose.Schema;

var productSchema = new Schema({
	//_id: mongo creates a self-generated id for every new db record, in this case, user.
	category: {type: Schema.Types.ObjectId, ref: "Category"},//replicate the objectId of an existing mongo document!!
	name: {type: String},
	price: {type: Number},
	image: {type: String}
});

productSchema.plugin(mongoosastic, {
	hosts: [
		"localhost:9200" //the default port number for local hosting on elastic search
	]
}); //with mongoosastic, we can use Product.search, Product.createMapping, etc. cool search functionality.

module.exports = mongoose.model("Product", productSchema);