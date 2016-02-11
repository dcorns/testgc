var router = require("express").Router();
var async = require("async");
var faker = require("faker");//a library that fakes all data inputs.

var Category = require("../models/category.js"); 
var Product = require("../models/product.js"); 

//INSTANT SEARCH API
router.post("/search", function(req, res, next) {
	console.log(req.body.search_term);
	Product.search({ 
		query_string: { query: req.body.search_term }
	}, function(e, drresults) {
		if (e) return next(e);
		res.json(drresults);
	});
});

//FAKER API
router.get("/:id", function(req, res, next) {
	async.waterfall([ //in the waterfall, the first function is index 0 and the second one is index 1
		function(callback) { //we search for the category name based on the name we type in the url
			Category.findOne({ _id: req.params.id }, function(e, category) {
				if(e) {
					return next (e);
				}	
				callback(null, category); //once you find the category, the next (index1) function is triggered.
			});
		},
		function(category, callback) {
			for (var i = 0; i < 30; i++) { //we loop 30 times to create 30 fake products by faker in the products db in mongodb.
			var product = new Product();
			product.category = category._id;//category.id retrieves the cat id based on the url name you typed.
			//all lines below will belong to the category.id retrieved in line 21
			//productName, price, and image and native methods to the faker library.
			//faker generates massive amounts of fake data
			product.name = faker.commerce.productName();
			product.price = faker.commerce.price();
			product.image = faker.image.image();

			product.save();
			}
		}
	]);
	res.json({ message: "Success!" });
});

module.exports = router; //export the file so it could be used by server.js and other app files.