//handles all user-relted routes - login, signup, logout, etc.
var router = require("express").Router();//we are using a Router method which is native to express.
var User = require("../models/user.js"); //we require the User object from the user.js file
var Cart = require("../models/cart.js");
var Game = require("../models/game.js");

var async = require("async");//we need async to assign each user a cart number upon user signup.
var passport = require("passport");//require the passport library because we will use one of its built-in functions
var passportConfig = require("../config/passport.js"); //we require the passport.js file

router.get("/login", function(req, res, next) {//we get the login data via the serialize-deserialize method in passport.js
	//we stored the session in a temporary data store: connectMongo
	if(req.user) {
		return res.redirect("/"); //if all goes well and there is a user, we redirect the user home, don't take them
		//back to the login page.
	}
	res.render("accounts/login", { //if no user/password is found the loginMessage will display the corresponding value
		//determined in the passport.ejs file.
		message: req.flash("loginMessage")//pass a req.flash message
	});
});

router.post("/login", passport.authenticate("local-login", { //we use the same name for local authentication as specified
//here we use the local-login middleware we created
//inthe passport.js file. we also pass three objects to passport.authenticate: successRedirect, failureRedirect, failureFlash
	successRedirect: "/profile",//if everything checks out the user is directed to their profile page.	
	failureRedirect: "/login",//if user fails to login, redirect to login toure with req.flash login message.
	failureFlash: true //we enable the req.flash message, the router.get above can receive the loginMessage.
}));

//retrieve the user's profile together with their purchase history
router.get("/profile", passportConfig.isAuthenticated, function(req, res, next) {
	User
		.findOne({ _id: req.user._id })
		.populate("currentTrades.game")
		.exec(function(e, user) {
			if (e) return next (e);
			res.render("accounts/profile", { user: user });
		});
});

router.get("/logout", function(req, res, next) { //logout our user and redirect to home page.
	req.logout();
	res.redirect("/");
});

router.get("/edit-profile", function(req, res, next) {//loads the page with an extra piece of data "success"
	res.render("accounts/edit-profile.ejs", { message: req.flash("success")
	});
});

router.post("/edit-profile", function(req, res, next) {
	//find the id that is the same as the user who is currently logged in.
	User.findOne({ _id: req.user._id }, function(e, user) {
		if (e) { //if there is an error- return the error
			return next (e);
		}
		if (req.body.name) { //if the user exists, replace the profile.data with the req.body data the user just typed in
			user.profile.name = req.body.name;
		}
		if (req.body.address) { //if the user exists, replace the profile.data with the req.body data the user just typed in
			user.address = req.body.address;
		}

		user.save(function(e) { //then save the user's updated data, flash the message, store in the session, and redirect back to edit-profile.
			if (e){
				return next (e);
			}
			req.flash("success", "You have successfully edited your profile!");
			return res.redirect("/edit-profile.ejs");
		});
	});
});

router.post("/game-entry", passportConfig.isAuthenticated, function(req, res, next) { //next here is a callback
	async.waterfall([
		function(firstcallback) {
			var game = new Game();

			game.name =  req.body.gamename;
			game.pricePaid =  req.body.pricepaid;
			game.language =  req.body.gamelanguage;
			game.yearPublished =  req.body.yearpublished;
			game.genre =  req.body.gamegenre;
			game.image = req.body.gameimage;
			game.owner = req.user._id;
			game.postingData.push({
				datePosted: req.body.dateposted,//one by one we push the items from the cart to the user's history
				quantity: req.body.gamequantity//one by one we push the prices from the cart to the user's history
			});
			game.save();
			firstcallback (null,game);
		},
		function(game) { //we pass the cart object to the second callback function
			User.findOne ({ _id: req.user._id }, function(e, user) {//a mongoose method to find one document in the mongoose database.
				if (!user) {
					req.flash("errors", "Please login to enter your games for consideration!");
					return res.redirect("/login");
				}
				if (user) {
					for (var i = 0; i < game.postingData.length; i++) {
						user.currentTrades.push({
							datePosted: game.postingData[i].datePosted,
							quantity: game.postingData[i].quantity
						});
					}
				user.save(function(e) {
					if (e) return next (e);							
					res.redirect("/profile");
				});
				}
			});	
		}		
	]);
});

router.get("/game-entry", function(req, res, next) {//we get the login data via the serialize-deserialize method in passport.js
	res.render("accounts/game-entry.ejs");
});

//facebook auth route to authenticate with facebook login
//we didn't give our auth middleware any name in passport.js, but we call it facebook here anyway.
router.get("/auth/facebook", passport.authenticate("facebook", { scope: "email" }));

//facebook callback auth route right after facebook has authenticated our login
router.get("/auth/facebook/callback", passport.authenticate("facebook", {
	successRedirect: "/profile", //if fb has authenticated the user - we riderct them to profile.
	failureRedirect: "/login"//login route is the failure route.
}));

//google auth route to authenticate with google login
//we didn't give our auth middleware any name in passport.js, but we call it google here anyway.
router.get('/auth/google', passport.authenticate('google', { scope: ['email'] 
}));

//google callback auth route right after google has authenticated our login
router.get("/auth/google/callback", passport.authenticate("google", {
	successRedirect: "/profile", //if goog has authenticated the user - we riderct them to profile.
	failureRedirect: "/login"//login route is the failure route.
}));

module.exports = router;
