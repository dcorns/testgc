module.exports = { //this line exports this information to the rest of the application.
	database: "mongodb://root:abc123@ds047345.mongolab.com:47345/nddecommerce",
	port: 3000,
	secretKey: "mason$#*&GFOIUEBF",
	
	facebook: { //we declare an object called facebook to lateron use on middleware
		clientID: process.env.FACEBOOK_ID || "1516214405349125",
		clientSecret: process.env.FACEBOOK_SECRET || "f6796f6ef0688125d96622ef91128232",
		profileFields: ["emails", "displayName"],
		callbackURL: "http://localhost:3000/auth/facebook/callback"

	},

	google: { //we declare an object called facebook to lateron use on middleware
	clientID: process.env.GOOGLE_ID || "776638304286-kgdhve4sjcbc72ff37c235uuoc2g6u5f.apps.googleusercontent.com",
	clientSecret: process.env.GOOGLE_SECRET || "EbmP7CSqY5idobDQ-a1fDrLN",
	profileFields: ["emails", "displayName"],
	returnURL: "http://localhost:3000/auth/google/return"

	},

	twitter: {
		consumerKey: process.env.TWITTER_CONSUMER_KEY || "rwGHAFO4pfGe4OoJpnYewnv0y",
		consumerSecret: process.env.TWITTER_CONSUMER_SECRET || "YKkGmoEP7boOsqOAt7PJDBF98KQ7RkklcohKXQbxqfemIrqlsa",
		profileFields: ["emails", "displayName"],
		callbackURL: "http://127.0.0.1:3000/auth/twitter/callback"

	}
}