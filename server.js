//LIBRARIES
var express = require("express");
var morgan = require("morgan"); //logs all user requests
var mongoose = require("mongoose");//enables mongo db
var bodyParser = require("body-parser");//enables us to read data from forms/postman
var ejs = require("ejs");//improves the rendering functionality of html pages
var ejsmate = require("ejs-mate");//an extension of ejs. improves the rendering functionality of html pages
var expressSession = require("express-session"); //session, cookieParser, and expressFlash are libraries that handle success and error messages
//session stores the userid, etc. into a memory store (mongodb, etc.)
var cookieParser = require("cookie-parser");//parses the cookie header and handles cookie separation and coding. it will take
//the session data and encrypt it and pass it to the browser.
//express uses a cookie to store the sessionID, and retrieves the user's information based on cookies and browser info
//cookieparser parses cookies and puts that information on the object 
var flash = require("express-flash");
//the connectmongo library is the database for storing the session
var mongoStore = require("connect-mongo/es5")(expressSession);//we pass the session id to the mongo store and specify we use ES5
var RedisStore = require( 'connect-redis' )(expressSession);
//mongostore depends on the express session. and instead of saving the session into a temp memory store, we want to
//save the session into the mongo db.
var passport = require("passport");//support local login, as well we fb, twitter, linkedin, etc.

var secret = require("./config/secret.js"); //we require the object from the secret.js file
var User = require("./models/user.js"); //we require the User object from the user.js file
var Category = require("./models/category.js"); //require the category file
var Game = require("./models/game.js"); 
var mainRoutes = require("./routes/main.js"); //we require the main.js file
var userRoutes = require("./routes/user.js");//we require the main.js file
var adminRoutes = require("./routes/admin.js");//we require the admin file.
var apiRoutes = require("./api/api.js"); //require the api file. 
var cartLength = require("./middleware/middleware.js"); //require the middleware file

var app = express(); //make app an express function. and app refers to express objects.

//we connect mongoose to the database; also create a user and mongodb deployment on mongolab.com:
mongoose.connect(secret.database, function(e) {
	if (e) {
		console.log(e);
	} else {
		console.log("Connected to Nick's lovely database!");
	}
});

//MIDDLEWARE
app.use(express.static(__dirname + "/public")); //teaches express that the static files are in the public folder
app.use(morgan("dev")); //we invoke the morgan object
app.use(bodyParser.json());//bodyParser takes the body of my REST requests and parses it into understanble commands for the server.
//with bodyparser the express application can parse json data format
app.use(bodyParser.urlencoded({ extended:true }));//express can parse x-www-form-urlencoded data (taken from postman)
app.use(cookieParser());
app.use(expressSession({
	resave: true,
	saveUninitialized: true, //forces a midway sessions to be saved
	secret: secret.secretKey,
	store: new mongoStore({//store session in the mongodb store
		url: secret.database,
		autoReconnect: true
	})
}));
app.use(flash());
app.use(passport.initialize());//we teach express how to use passport.js
app.use(passport.session());//changes the user value that is currently the userid from client cookie, into the true
//deserialized user object
app.use(function(req, res, next) {//give the user object to each route
	res.locals.user = req.user; //locals is a local variable to each route
	next();
});
app.use(function(req, res, next) {
	User.find({}, function(e, users) {//we leave find{} because we want to find all users.
		if (e) {
			next(e);
		}
		res.locals.users = users; //store all users in the local variable called users.
		next();
	});
});
app.use(function(req, res, next) {//give the user object to each route
	res.locals.game = req.game; //locals is a local variable to each route
	next();
});
app.use(function(req, res, next) {
	Game.find({}, function(e, games) {//we leave find{} because we want to find all users.
		if (e) {
			next(e);
		}
		res.locals.games = games; //store all users in the local variable called users.
		next();
	});
});
app.use(cartLength);//for each middleware file we require, we have to enable the app to use it by app.use
app.use(function(req, res, next) {
	Category.find({}, function(e, categories) {//we leave find{} because we want to find all categories.
		if (e) {
			next(e);
		}
		res.locals.categories = categories; //store all categories in the local variable called categories.
		next();
	});
});
app.use( expressSession({ 
  secret: 'cookie_secret',
  name:   'kaas',
  store:  new RedisStore({
    host: '127.0.0.1',
    port: 6379
  }),
  proxy:  true,
    resave: true,
    saveUninitialized: true
}));
app.engine("ejs", ejsmate);//shows what kind of engine we want to use. in this case - we want to use ejs-mate
app.set("view engine", "ejs");//set the engine to whatever engine we want - in this case, our viewing engine is ejs 
//now we have to create a folder called views to use ejs properly.
app.use(mainRoutes);
app.use(userRoutes);
app.use(adminRoutes);
app.use("/api", apiRoutes); //all apis in the router will be sub-urls of the api url name, so we don't have to type api each time.

//--start the server on port 3000
app.listen(secret.port, function(e) {
	if(e) throw e;
	console.log("Ready captain... we're running on port " + secret.port + "!");
});