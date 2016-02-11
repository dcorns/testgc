//LIBRARIES
var mongoose = require("mongoose");
var bcrypt = require("bcrypt-nodejs");
var crypto = require("crypto");

var Schema = mongoose.Schema;

/* 1) create user schema attributes/fields */
var userSchema = new Schema({
	//_id: mongo creates a self-generated id for every new db record, in this case, user.
	email: {type: String, unique: true, lowercase: true},
	password: {type: String},
	facebook: {type: String}, //we add to accomodate facebook oauth
	twitter: {type: String}, //we add to accomodate twitter oauth
	tokens: Array, //we add to accomodate facebook oauth
	profile: {
		name: {type: String, default: ""},
		picture: {type: String, default: ""}
	},
	address: {type: String},
	history: [{ //the history of the behavior and trnasactions of the user
		paid: {type: Number, default: 0},
		item: {type: Schema.Types.ObjectId, ref: "Product"}
	}]
});

// var user = new User();
// user.email = "";
// user.profile.name = "Batman";


/* 2) hash passwords before saving them to the database */
userSchema.pre("save", function (next) { //pre is a mongoose method that each Schema will have - means save it before
	//saving it to the database
	var user = this; //an object that refers to the userSchema
	if(!user.isModified("password")) {
		return next();
	}
	bcrypt.genSalt(10, function(e, salt) { //genSalt will generate 10 rounds of random data salt generation
		if (e) {
			return next(e);
		}
		bcrypt.hash(user.password, salt, null, function(e, hash) {
			if (e) {
				return next(e);
			}
			user.password = hash;
			next();
		});
	});
});

//this is a method that can preset the name of each user to handsome in the db regardless of what they typed ahead of time.
// userSchema.pre("save", function (next) { 
// 	var user = this; 
// 	user.name = "Handsome";
// });

/* 3) compare password in the db to the one that the user has typed in */
userSchema.methods.comparePassword = function(password) { //we want to create a new custom method.
	return bcrypt.compareSync(password, this.password); //passwoard is what i typed, this.password is the pass in the db
}

//below we create a custom method to populate the profile page with gravatar's template
userSchema.methods.gravatar = function(size) {
	if(!this.size) { //if no size specified, set it to 200
		size = 200;
	}
	if(!this.email) {//if there is no user email, then simply return a random image from gravatar.
		return "https://gravatar.com/avatar/?s" + size + "&d=retro";
	}
	var md5 = crypto.createHash("md5").update(this.email).digest("hex");//it the email exist, you want to hash it into
	//md5 encryption, so that the email will be unique and each user will have a unique picture
	return "http://gravatar.com/avatar/" + md5 + "?s=" + size + "&d=retro";//then you retutn the image and add the md5
	//in the api that grvatar has opened for us. the picture would belong to only one user.
}

//we need to export the whole schema module to mongolab so that other files could use it - below:
module.exports = mongoose.model("User", userSchema);


