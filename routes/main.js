//handles all main routes - home, search, cart, etc.
var router = require("express").Router();//we are using a Router method which is native to express.
var async = require("async");
var stripe = require("stripe")("sk_test_LUPjCp7bnDxK8FgEsgShU62D");//require a stripe payments library and your stripe test secret key

var User = require("../models/user.js");
var Product = require("../models/product.js");
var Cart = require("../models/cart.js");

var stream = Product.synchronize(); //first we synchronize the prductSchema in the elastic replica data set
var count = 0;

function paginate(req, res, next) { //we create a new paginate function to control pagination on every get route
	var perPage = 9; //we will display a max of 9 products per page.
		var dspage = req.params.page;

		Product //we will use multiple mongoose methods below (find, skip, etc.)
			.find()//we string these methods, therefore there is no ; after each line
			.skip( perPage * dspage )//skips the number of documents needed to go the given page
			.limit( perPage ) //limits how many documents are displayed at any one time.
			.populate("category")
			.exec(function(e, typroducts) {
				if (e) return next (e);
				Product.count().exec(function(e, qcount) { //.count is a mongoose method to count all docs, we need this
					//to divide the total number of docs by the perPage docs.
					if (e) return next (e);
					res.render("main/product-main.ejs", {
						products: typroducts,
						pages: qcount / perPage
					});
				});
			});
}

//we will connect the product db to elastic search.
Product.createMapping(function(e, mapping) {
	if (e) {
		console.log("error while creating mapping");
		console.log(e);
	} else {
		console.log("Mapping created successfully!");
		console.log(mapping);
	}
});

stream.on("data", function() {//an elastic method to count the documents in the database/schema
	count++;
});

stream.on("close", function() {//we close the whole synchornization method and will count all documents
	console.log("Indexed " + count + " documents!");
});

stream.on("error", function(e) {//method to handle errors with elastic search
	console.log(e);
});

//render cart route
router.get("/cart", function(req, res, next) {
	Cart
		.findOne({ owner: req.user._id })//find if user.id exists
		.populate("items.item")//populate item.items models/cart.js because we want to get elements like image, name, original product
		.exec(function(e, foundCart) {
			if (e) return next(e);
			res.render("main/cart.ejs", {
				foundCart: foundCart,
				message: req.flash("remove")
			});
		});
});


//post items to the cart each time you want to buy a product
router.post("/product/:product_id", function(req, res, next) {
	Cart.findOne({ owner: req.user._id }, function(e, cart) { //we find the owner of the cart first
		cart.items.push({//push the items you want to buy because each item is an array.
			item: req.body.product_id,//if we find the owner, we want to push all the items 
			//because we pulled this product._id we can populate items.item in the cart get route above - this is interesting.
			price: parseFloat(req.body.priceValue), //parse to float to keep decimal
			quantity: parseInt(req.body.quantity)//parse to int because there is no decimal
			//the above name req.body.quantity needs to be the same as the element id in product.ejs
		});
		cart.total = (cart.total + parseFloat(req.body.priceValue)).toFixed(2);//keep the value of the total price to two decimals
		//above we force the value of the req.body to float to be on the safe side and make sure we can add it.
		//because most of the requests in req.body are text
		cart.save(function(e) {//finally we save the data to the cart database.
			if (e) return next(e);
			return res.redirect("/cart");
		});
	});
});

//remove items from the cart if you change your mind about buying a product
router.post("/remove", function(req, res, next) {
	Cart.findOne({ owner: req.user._id }, function(e, foundCart) {//we pull the id of the items, and then we pull the product we dont need
		foundCart.items.pull(String(req.body.item));//converting the item to string in case it is not a string yet
		//then remove these items from the cart.

		foundCart.total = (foundCart.total - parseFloat(req.body.price)).toFixed(2);//subtract the price of the items you removed from the cart
		foundCart.save(function(e,found) {
			if (e) return next(e);
			req.flash("remove", "Successfully removed item");
			res.redirect("/cart");
		});
	});
});

//--redirect to a search route and pass the request in the req.body.q alongside
router.post("/search", function(req, res, next) {
	res.redirect("/search?q=" + req.body.q);
});

router.get("/search", function(req, res, next) {
	if(req.query.q) {
		Product.search({ //.search is an elasticsearch method
			query_string: { query: req.query.q } //we will search the value of req.query.q that we received from router.port/search
		//and it will search the elasticsearch replica set			
		}, function(e, zresults) {
			if (e) return next(e);
			var data = zresults.hits.hits.map(function(hit) {//if it finds the data will return the results
				//.map in a JS built in function that will look inside the second hits object and will avoid us having to
				//nest the value that we want in a complicated coding statement
				//the actual value sits in ._source in the second hits object. 
				return hit;//finally we map our elasticsearch object
			});
			res.render("main/search-result.ejs", {//lastly we render the data retrieved in the mapping above 
				query: req.query.q,
				data: data//the data we found, in the variable we specified above
			});
		});
	}
});

//--render our home page
router.get("/", function(req, res, next) { //user router instead of app, router is a subpath of a certain route
	if (req.user) { //if the user has logged in - enter the below - this is called pagination
		//below we add pagination to the home route, so we don't need to render all data at once.
		paginate(req, res, next);
	} else { //if there is no user/the user hasn't logged in - render the below
		res.render("main/home.ejs");
	}
});

//--render pagination route for each successive page
router.get("/page/:page", function(req, res, next) { //user router instead of app, router is a subpath of a certain route
	paginate(req, res, next);//we reuse the pagination function and it updates with the right number of skipped items
});

router.get("/about", function(req,res) {//req is we're requesting sth from the server, and res
	//the server responding with a response. for example: res.json("My name is " + name);
	res.render("main/about.ejs");
});

//render the category page
router.get("/products/:id", function(req, res, next) {//colon parameter is used when you want to go to a dynamic specific param.
//so products/:id is the same as (products/books_id, products/foods_id, products/wines_id, etc.)	
	Product
		.find({ category: req.params.id })//we are querying the category id from the productschema, the catid only accepts objectid, as we set it up
		//in this case also req.params.id = /:id in the url
		.populate("category")//you can only populate if the data type is objectid. with populate you grab
		//the rest of the data from each category object, based on the category id, and present the full object on our category page.
		.exec(function(e, products) {//we execute a function to return all products in a given category object.
			if(e) return next(e); //if error, return callback with an error
			res.render("main/category.ejs", {
				products: products
			});
		});
});

//render each product page
router.get("/product/:id", function(req, res, next) {
	Product.findById({ _id: req.params.id }, function(e, product) {
		if (e) return next (e);
		res.render("main/product", {
			product: product
		});
	});
});

// //ARASH's stripe payment api/route = WE ARE NOT USING THIS IN THE APP FOR NOW
// router.post("/payment", function(req, res, next) { //payment route in stripe
// 	var stripeToken = req.body.stripeToken;
// 	var currentCharges = Math.round(req.body.stripeMoney * 100);//the total amount in each cart that is sent to stripe and * 100 beacuse it's in cents
// 	stripe.customers.create({
// 		source: stripeToken,
// 	}).then(function(customer) {//stripe uses promises - try to convert the whole app to prmise later on
// 		return stripe.charges.create({
// 			amount: currentCharges,
// 			currency: "usd",
// 			customer: customer.id
// 		});
// 	}).then(function(charge) {
// 		async.waterfall([
// 			function(firstCallback) {
// 				Cart.findOne({ owner: req.user._id}, function(e, cart) { //we search for the cart based on the logged user
// 					firstCallback(e, cart);//we retrieve the cart in the executional context and pass it to the second function.
// 				});
// 			}, 
// 			function(cart, secondCallback) { //we pass the cart object to the second callback function
// 				User.findOne({ _id: req.user._id }, function(e, tuser) {
// 					if (tuser) {
// 						for (var = i; i < cart.items.length; i++) { //we loop through the cart items of that user
// 							user.history.push({
// 								items: cart.items[i].item,//one by one we push the items from the cart to the user's hisotry
// 								paid: cart.items[i].price//one by one we push the prices from the cart to the user's hisotry
// 							});
// 						}
// 						tuser.save(function(e, user) { //we save the updated user after we have looped through the cart and added each
// 							//item in the cart to the users history list and the prices to the user total list
// 							if (e) return next (e);
// 							secondCallback(e, user);//we pass the updated user object via the second callback to the final function.
// 						});
// 					}
// 				});
// 			},
// 			function(user) {
// 				Cart.update({ owner: user._id }, { $set: { items: [], total: 0}}, function(e, updated) {//the cart will check the owner id and update itself to zero.
// 				//.update is a built-in mongoose method; $set is another built in method to set the items to empty and the total to 0	
// 					if(updated) {
// 						res.redirect("/profile");
// 					}
// 				}); 
// 			}
// 		]);
// 	});
// });
//ARASH's stripe payment api/route = WE ARE NOT USING THIS IN THE APP FOR NOW - END

//Stripe route i created to accomodate checkout
router.post("/charge", function(req, res, next) { //payment route in stripe
	// var currentCharges = Math.round(req.body.stripeMoney * 100);//the total amount in each cart that is sent to stripe and * 100 beacuse it's in cents
	var stripeToken = req.body.stripeToken;

	var charge = stripe.charges.create({
	  amount: 100, // amount in cents, again
	  currency: "usd",
	  source: stripeToken,
	  description: "Example charge"
	}, function(err, charge) {
	  if (err && err.type === 'StripeCardError') {
	    // The card has been declined
	  }
	}).then(function(charge) {
		async.waterfall([
			function(firstCallback) {
				Cart.findOne({ owner: req.user._id}, function(e, cart) { //we search for the cart based on the logged user
					firstCallback(e, cart);//we retrieve the cart in the executional context and pass it to the second function.
				});
			}, 
			function(cart, secondCallback) { //we pass the cart object to the second callback function
				User.findOne({ _id: req.user._id }, function(e, user) {
					if (user) {
						for (var i = 0; i < cart.items.length; i++) { //we loop through the cart items of that user
							user.history.push({
								item: cart.items[i].item,//one by one we push the items from the cart to the user's history
								paid: cart.items[i].price//one by one we push the prices from the cart to the user's history
							});
						}
						user.save(function(e, user) { //we save the updated user after we have looped through the cart and added each
							//item in the cart to the users history list and the prices to the user total list
							if (e) return next (e);
							secondCallback(e, user);//we pass the updated user object via the second callback to the final function.
						});
					}
				});
			},
			function(user) {//where is this last function executed? Something for you to look into!!
				Cart.update({ owner: user._id }, { $set: { items: [], total: 0}}, function(e, updated) {//the cart will check the owner id and update itself to zero.
				//.update is a built-in mongoose method; $set is another built in method to set the items to empty and the total to 0	
					if(updated) {
						res.redirect("/profile");
					}
				}); 
			}
		]);
	});
});
// //route i created to accomodate subscriptions - THIS CODE IS NOT WORKING
// router.post("/subscribe", function(req, res, next) { //payment route in stripe
// 	function(customer) {
// 	return stripe.customers.create({
// 	  source: token, // obtained with Stripe.js
// 	  plan: "001",
// 	  email: customer.email
// 	}, function(err, customer) {
// 	  // asynchronously called
// 	});
// 	res.redirect("/profile"); 
// });

module.exports = router;



