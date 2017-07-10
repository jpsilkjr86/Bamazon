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


var BamazonOrder = function (item_id=0, requested_quantity=0, // callback, 
	existsInDatabase=false, product_name='', price=0, department_name='', total_cost=0) {
	
	// these are the first items that will be received
	this.item_id = item_id;
	this.requested_quantity = requested_quantity;

	// saves 'this' object as more manageable variable
	const thisOrder = this;

	// queries database for most recent product data
	connection.query('SELECT * FROM products WHERE item_id=?', [item_id], function(err, results) {
		if (err) {
			// console.log(err);
			return new Promise(function(resolve){
				resolve(thisOrder, err);
			});
		}

		if (results.length === 0) {
			thisOrder.existsInDatabase = false;
			return new Promise(function(resolve){
				resolve(thisOrder, results);
			});			
		}

		thisOrder.existsInDatabase = true;

		// these values are updated after mysql query. default values set in paramters above.
		thisOrder.product_name = results[0].product_name;
		thisOrder.price = results[0].price;

		// calculated by multiplying price and requested_quantity
		thisOrder.total_cost = thisOrder.price * thisOrder.requested_quantity;

		// if requested_quantity > results[i].stock_quantity
		// 

		console.log(results);
		console.log(thisOrder);

		// callback parameters include the updated hash of thisOrder
		// and the query results (i.e. the most updated product data)
		return new Promise(function(resolve){
			resolve(thisOrder, results[0]);
		});

	});

		
};


// constructor to be exported
// var BamazonOrder = function (item_id=0, requested_quantity=0, callback, 
// 	existsInDatabase=false, product_name='', price=0, department_name='', total_cost=0) {
	
// 	// these are the first items that will be received
// 	this.item_id = item_id;
// 	this.requested_quantity = requested_quantity;

// 	// saves 'this' object as more manageable variable
// 	const thisOrder = this;

// 	// queries database for most recent product data
// 	connection.query('SELECT * FROM products WHERE item_id=?', [item_id], function(err, results) {
// 		if (err) {
// 			console.log(err);
// 			return connection.end();
// 		}

// 		if (results.length === 0) {
// 			thisOrder.existsInDatabase = false;
// 			return callback(thisOrder, results[0]);
// 		}

// 		thisOrder.existsInDatabase = true;

// 		// these values are updated after mysql query. default values set in paramters above.
// 		thisOrder.product_name = results[0].product_name;
// 		thisOrder.price = results[0].price;

// 		// calculated by multiplying price and requested_quantity
// 		thisOrder.total_cost = thisOrder.price * thisOrder.requested_quantity;

// 		// if requested_quantity > results[i].stock_quantity
// 		// 

// 		console.log(results);
// 		console.log(thisOrder);

// 		// callback parameters include the updated hash of thisOrder
// 		// and the query results (i.e. the most updated product data)
// 		callback(thisOrder, results[0]);

// 	});

		
// };

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