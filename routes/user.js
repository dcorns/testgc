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
	// res.json(req.user);//this would display the profile of the user, this is a get route.
	//OLD CODE BEGINS!!
	// User.findOne({ _id: req.user._id }, function(e, user) {//check if the userid exists in the db
	// 	if(e) {
	// 		return next(e);
	// 	}
	// 	res.render("accounts/profile.ejs", { user: user });//this would display the full page with an additional
	// 	//parameter which is the user object
	// });
	//OLD CODE ENDS!!
	//at the top, in the new code, we add passportConfig.isAuthenticated. in this case, if the user is not authenticated and types in
	//the /profile address in the url bar, the user will be redirected to a login page, per the middleware code in passport.js
	User
		.findOne({ _id: req.user._id })
		.populate("history.item")
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
			return res.redirect("/edit-profile");
		});
	});
});
//---NICKS EXPERIMENTING ROUTES BEGIN
router.post("/game-entry", function(req, res, next) { //next here is a callback
	async.waterfall([//learm from 3 step async waterfall in stripe in routes/main.js
		//we first create a new user as a callback function.
		function(firstcallback) {
			var game = new Game();

			game.name =  req.body.gamename;
			game.condition =  req.body.gamecondition;
			game.pricePaid =  req.body.pricepaid;
			game.language =  req.body.gamelanguage;
			game.yearPublished =  req.body.yearpublished;
			game.genre =  req.body.gamegenre;
			game.image = req.body.gameimage;

			firstcallback (null,game);
		},
		function(game) {
			User.findOne ({ _id: req.user._id }, function(e, existingUser) {//a mongoose method to find one document in the mongoose database.
				if (!existingUser) {
					req.flash("errors", "Please login to enter your games for consideration!");
					// res.json("User " + req.body.email + " already exists!");
					return res.redirect("/login");
				}
				game.owner = existingUser._id;
				game.save(function(e) {
				if (e) return next (e);
				res.redirect("/profile");//we send the user back to the profile page.
				});
			});
		}
	]);
});

router.get("/game-entry", function(req, res, next) {//we get the login data via the serialize-deserialize method in passport.js
	res.render("accounts/game-entry.ejs");
});


//---NICKS EXPERIMENTING ROUTES END



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
