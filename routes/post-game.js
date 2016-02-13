var router = require("express").Router();//we are using a Router method which is native to express.
var User = require("../models/user.js"); //we require the User object from the user.js file
var Game = require("../models/game.js");
var async = require("async");//we need async to assign each user a cart number upon user signup.
var passport = require("passport");//require the passport library because we will use one of its built-in functions
var passportConfig = require("../config/passport.js"); //we require the passport.js file

router.post("/game-entry", function(req, res, next) { //next here is a callback
	async.waterfall([
		//we first create a new user as a callback function.
		function(callback) {
			var game = new Game();

			game.gameName =  req.body.game-name;
			game.gameCondition =  req.body.game-condition;
			game.pricePaid =  req.body.price-paid;
			game.gameLanguage =  req.body.game-language;
			game.yearPublished =  req.body.year-published;
			game.gameGenre =  req.body.game-genre;
			game.gameImage = req.body.game-image;

			User.findOne ({ email: req.body.email }, function(e, existingUser) {//a mongoose method to find one document in the mongoose database.
				if (!existingUser) {
					req.flash("errors", "Please login to enter your games for consideration!");
					// res.json("User " + req.body.email + " already exists!");
					return res.redirect("/login");
				} 
			});

			game.save(function(e, game) { //lastly - we save the user object to the database, and add validation.
				if (e) {
					return next(e);
				}
				//we need to assign the new user a cart id
				callback(null, game);//we save the user and call the section function while passing the user on.				
			});
		},
		function(game) {
			game.gameOwner = user._id;
			game.save(function(e) {
				if (e) return next (e);
				res.redirect("/profile");//we send the user back to the profile page.
			});
		}
	]);
});

router.get("/game-entry", function(req, res, next) {//we get the login data via the serialize-deserialize method in passport.js
	res.render("accounts/game-entry.ejs");
});