// imports keys for password validation
var keys = require('../keys/keys.js');

// imports mysql npm and establishes connection
var mysql = require('mysql');
var connection = mysql.createConnection({
	host: 'localhost',
	port: 3306,
	user: 'root',
	password: keys.pw.mysqlpw,
	database: 'bamazon'
});

// constructor to be exported
var BamazonOrder = function (item_id=0, requested_quantity=0, existsInDatabase=false, product_name='', price=0) {
	// this are the first items that will be received
	this.item_id = item_id;
	this.requested_quantity = requested_quantity;
	// these values are updated after mysql query. default values set in paramters above.
	this.existsInDatabase = existsInDatabase;
	this.product_name = product_name;
	this.price = price;
	// calculated by multiplying price and requested_quantity
	this.total_cost = this.price * this.requested_quantity;
};

// function that loops through productsArray argument
// and sees if the id exists
BamazonOrder.prototype.isIdValid = function(productsArray) {
	for (let i = 0; i < productsArray.length; i++) {
		if (productsArray[i].item_id === this.item_id) {
			return true;
		}
	}
	return false;
};

// function that updates an order with the latest product data (obtained as argument)
BamazonOrder.prototype.updateLatestProductData = function(latestProductData) {
	this.item_id = latestProductData.item_id;
	this.product_name = latestProductData.product_name;
	this.price = latestProductData.price;
	this.total_cost = this.price * this.requested_quantity;
};

BamazonOrder.prototype.checkout = function () {
	// saves object as more manageable variable
	let thisOrder = this;

	connection.query('SELECT * FROM products WHERE item_id=?', [thisOrder.item_id], function(err, results) {
		if (err) {
			console.log('Error connecting to servrer.');
			console.log(err);
			connection.end();
			return;
		}

		if (results.length === 0) {
			thisOrder.existsInDatabase = false;
			return;
		}

		thisOrder.existsInDatabase = true;

		// if requested_quantity > results[i].stock_quantity
		// 

		console.log(results);
		console.log(thisOrder);

	});
};
	

module.exports = BamazonOrder;