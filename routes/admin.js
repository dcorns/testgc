//handles all user-relted routes - login, signup, logout, etc.
var router = require("express").Router();//we are using a Router method which is native to express.
var Category = require("../models/category.js");//we require the category object from the category.js file.


router.get("/add-category", function(req, res, next) {
	res.render("admin/add-category.ejs", { message: req.flash("success")});
});

router.post("/add-category", function(req, res, next) {
	var category = new Category();//we instantiated a new object of the category
	category.name = req.body.name;//makes the name equal to the input text name

	category.save(function(e, next) {
		if(e) {
			return next (e);//if error - return it.
		}
		req.flash("success", "Succesfully added a new game category!");
		return res.redirect("/add-category");
	});
});

module.exports = router; //we have to export the router in router.post

//also in order for this file to work, you have to require it within server.js