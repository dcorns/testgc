var Cart = require("../models/cart.js");

module.exports = function(req, res, next) {//we export the entire middleware block to the other files in the app
	if (req.user) {
		var total = 0;//if we have a user, we create a new variable total to store the product
		Cart.findOne({ owner: req.user._id }, function(e, zcart) {//we use mongoose's findone to search for the owner
			//with the same id as the cart owner
			if (zcart) {
				for (var i = 0; i < zcart.items.length; i++) {//we need to loop the quantity to ensure that we count
					//correctly if we have purchased the same item several times.
					total += zcart.items[i].quantity; //if the cart exists, increment the total by the quantity of the 
					//product in the cart.
				}
				res.locals.zcart = total;//then set the total to a local variable named cart
				//we need to use the local variable cart, so we can attach it to the navbar of the site.
			} else {
				res.locals.zcart = 0; //if no cart is found, make the total = 0
			}
			next();//finish the callback to proceed to the next action.
		});
	} else {
		next();//callback
	}
}