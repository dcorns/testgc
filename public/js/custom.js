//we will install ajax and jquery scripts in custom.js
//add the needed custom.js reference to javascriptonly.ejs too. 
//we will also target certain html elements by giving them classes and ids.
//each time the user types a search parameter, the ajax script will notify the server and point to the instant search api script under api.js
//if an instant search value is found, it will immediately delete all the html products on the page and append the value it 
//found.

//SEARCH FUNCTIONALITY - we start with the jquery code below, it starts with $ to indicate jquery:
$(function() {

	//we target the searchBox id first
	$("#searchBox").keyup(function() { //keyup is a jquery function where as long as you type in a targeted id it will
		//immediately run the anonymous function and perform the ajax call below.
		var search_term = $(this).val();
		//we make the ajax call next
		$.ajax({
			method: "POST",
			url: "/api/search",
			data: {
				search_term //this is the name of the input text field.
			},
			dataType: "json",
			success: function(json) {
				//we will copy the same map function from main.js
				var data = json.hits.hits.map(function(hit) {//if it finds the data will return the results
				//if success we take the data object and apply the elasticsearch map method on it.
				//.map in a JS built in function that will look inside the second hits object and will avoid us having to
				//nest the value that we want in a complicated coding statement
				//the actual value sits in ._source in the second hits object. 
				return hit;//finally we map our elasticsearch object
			});
				//in the next block we will edit the html elements to reflect the immediate results from jquery.
				//we will empty the current search results and replace with the immediate search term
				$("#searchResults").empty();
				for(var i = 0; i < data.length; i++) {
					var html = ""; //you should remove the <%= weird syntax - it's only good for ejs, not for js
					html += '<div class="col-md-4">'; //we copy the same html design from product-main.js, one by one, to look consistent.
					html += '<a href="/product/' + data[i]._source._id + '">';//we are adding all pre-existing design elements to the html variable.
					html += '<div class="thumbnail">';
					html += '<img src="' + data[i]._source.image + '">';
					html += '<div class="caption">';
					html += "<h3>" + data[i]._source.name + "</h3>";
					html += "<p>" + data[i]._source.category.name + "</p>";
					html += "<p>$" + data[i]._source.price + "</p>";
					html += "</div></div></a></div>";

					//lastly we append the html variable to the searchResults. which will force the data to display.
					$("#searchResults").append(html);
				}				
			},
			error: function(e) {
				console.log(e);
			}
		});
	});
});

//ENABLE +/- buttons in the cart functionality:

$(document).on("click", "#but-plus", function(r) {//event driven method that calls the id but-plus in product.ejs
	r.preventDefault();//prevents the rest of the page to be refreshed
	var priceValue = parseFloat($("#priceValue").val());//we parse the price value to a float type and add.val() to be able to do calculations
	//otherwise the price is input at text.
	var quantity = parseInt($("#hid-quantity").val());//parse quant to int type and add.val() to convert it to a number from a text.

	priceValue += parseFloat($("#priceHidden").val());//increment the original priceValue with the parsed price from the ordered product itself.
	quantity += 1; //we increment the quantity by 1

	$("#hid-quantity").val(quantity);//we replace the current html value of the hidden quanity with the newly created quantity
	$("#priceValue").val(priceValue.toFixed(2));//we change the current price with the new price	
	$("#but-total").html(quantity);//we change the total quantity as well
});

$(document).on("click", "#but-minus", function(r) {//event driven method that calls the id but-plus in product.ejs
	r.preventDefault();//prevents the rest of the page to be refreshed
	var priceValue = parseFloat($("#priceValue").val());//we parse the price value to a float type and add.val() to be able to do calculations
	//otherwise the price is input at text.
	var quantity = parseInt($("#hid-quantity").val());//parse quant to int type and add.val() to convert it to a number from a text.

	//we will prevent the quantity from being 0 or negative
	if(quantity === 1) {//if quantity is = 1, it will always be one.
		priceValue = $("priceHidden").val();
		quantity = 1;
	} else {
		priceValue -= parseFloat($("#priceHidden").val());//increment the original priceValue with the parsed price from the ordered product itself.
		quantity -= 1; //we increment the quantity by 1
	}
	
	$("#hid-quantity").val(quantity);//we replace the current html value of the hidden quanity with the newly created quantity
	$("#priceValue").val(priceValue.toFixed(2));//we change the current price with the new price	
	$("#but-total").html(quantity);//we change the total quantity as well
});