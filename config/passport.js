//think of passport as a config route or as middleware that express needs to access.
var passport = require("passport");//support local login, as well we fb, twitter, linkedin, etc.
var async = require("async");//require async processing.
var localStrategy = require("passport-local").Strategy;//supports local login in particular.
var facebookStrategy = require("passport-facebook").Strategy;//suports facebook oauth login
var googleStrategy = require("passport-google-oauth2").Strategy;

var secret = require("../config/secret.js");//we require the secret file to access the information facebook provides for us.
var User = require("../models/user.js"); //we require the User object from the user.js file
var Cart = require("../models/cart.js"); //we require cart to update it for the fb users in the fb middleware code block

//serialize and deserialize the user object
passport.serializeUser(function(guser, done) { //anonymous fuction with a user and a callback.
	//here we convert the user object into a format that is storeable.
	//we will store the object in connect-mongo and later in mongodb.
	done(null, guser._id); //._id exists in every mongodb by default.
	//then guser._id is stored in the session and will be used to retrieve the whole user object via the 
	//deserialize function below.
});

passport.deserializeUser(function(gid, done) {
	//with deserialize we retrieve the object via the user-id. we will find the id via the mongoose method findbyid.
	//the id can be anything - name, email, etc.
	User.findById(gid, function(e, user) { //first we check if the user exists.
		done(e, user); //if we find an existing - produce an error and the user.
	});
});

//middleware to process the local login mechanism
passport.use("local-login", new localStrategy({//local-login is the name of the midleware
	//we create a new anonymous field of localStrattegy and pass it the required user object fields: username, password, etc.
	usernameField: "email",
	passwordField: "password",
	passReqToCallback: true
}, function (req, demail, zpassword, next) { //next is the callback. we validate the user entry for a number of various errors.
	User.findOne({email: demail}, function(e, user) {
		if (e) {
			return next(e);
		}
		if (!user) {
			return next(null, false, req.flash("loginMessage", "No such user has been found"));
		}
		if (!user.comparePassword(zpassword)) { //we use the custom method comparePassword from user.js
			return next(null, false, req.flash("loginMessage", "Oops, wrong password!"));
		}
		return next(null, user); //if everything works, we return the callback with the user.
	});
}));

//middleware to process the facebook login mechanism
passport.use(new facebookStrategy(secret.facebook, function (token, refreshToken, profile, done) { 
//use passport teaches passport a new technique how to authenticate with facebook
//the secret.facebook naming is from our secret.js file, we pass that facebook object here
//token is token that fb gives to us once the informatino fromthe secret js file we gave to fb is correct.
//we don't use refreshToken - it's just listed there
//profile is the data (name, gender) that facebook gives us and we call it profile.
//done is the callback
	User.findOne({ facebook: profile.id }, function (e, user) {
		if (e) return done(e); //if error, return it
		if (user) {
			return done (null, user);//if we find a user, return the user and pass the user object to the routes
		} else {
			async.waterfall([//first we will create a new fb user and second we will pass this fb user's id to create a new cart.
				function(callback) {
					var newUser = new User(); //if we don't find a user, we want to create a new user.
						newUser.email = profile._json.email;
						newUser.facebook = profile.id;
						newUser.tokens.push({ kind: "facebook", token: token });
						newUser.profile.name = profile.displayName;
						newUser.profile.picture = "https://graph.facebook.com/" + profile.id + "/picture?type=large";

						newUser.save(function(e) {
							if(e) throw e;
							callback(e, newUser);//we pass the newly created user id to the second function below.
							// return done (null, newUser); - part of the old fb middleware when we didn't have to update for cart creation
						});
				}, 
				function(newUser) { //we have passed in the newUser from the above function - closure
					var cart = new Cart();//we create a new cart object
					cart.owner = newUser._id;//we pass the fb new user id as the new cart owner's id.
					cart.save(function(e) {//we save the cart
						if (e) return done (e);
						return done (e, newUser);//we call with the newUser so the middleware can authenticate and redurect the new user to the appropriate route.
					});
				}
			]);
		}
	});
}));

//middleware to process the google login mechanism
passport.use(new googleStrategy(secret.google, function(token, tokenSecret, profile, cb) {
    User.findOne({ google: profile.id }, function (e, user) {
		if (e) return cb(e); //if error, return it
		if (user) {
			profile.identifier=profile.id;
			return cb (null, user);//if we find a user, return the user and pass the user object to the routes
			console.log(user);
		} else {
			async.waterfall([//first we will create a new fb user and second we will pass this fb user's id to create a new cart.
				function(callback) {
					var newUser = new User(); //if we don't find a user, we want to create a new user.
						newUser.email = profile.email;
						newUser.google = profile.id;
						newUser.tokens.push({ kind: "google", token: token });
						newUser.profile.name = profile.displayName;
						newUser.profile.picture = profile.picture;
						
						newUser.save(function(e) {
							if(e) throw e;
							callback(e, newUser);//we pass the newly created user id to the second function below.
							// return done (null, newUser); - part of the old fb middleware when we didn't have to update for cart creation
						});
				}, 
				function(newUser) { //we have passed in the newUser from the above function - closure
					var cart = new Cart();//we create a new cart object
					cart.owner = newUser._id;//we pass the fb new user id as the new cart owner's id.
					cart.save(function(e) {//we save the cart
						if (e) return cb (e);
						return cb (e, newUser);//we call with the newUser so the middleware can authenticate and redurect the new user to the appropriate route.
					});
				}
			]);
		}
	});
}));


//custom function to determine if user is logged in
exports.isAuthenticated = function(req, res, next) {
	if(req.isAuthenticated()) {
		return next(); //if the request is autnehticated hten grant the user the information.
	}
	res.redirect("/login");//if the user is not quthenticated, return them to the login page.
}


