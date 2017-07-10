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


var BamazonOrder = function (item_id=0, requested_quantity=0, product_name='', price=0, 
	department_name='', total_cost=0, order_success=false, order_status=null) {
	
	// these are the first items that will be received
	this.item_id = item_id;
	this.requested_quantity = requested_quantity;		
};


BamazonOrder.prototype.checkout = function () {
	// saves 'this' object as more manageable variable
	const thisOrder = this;

	return new Promise(function(resolve, reject) {
		// queries database for most recent product data
		connection.query('SELECT * FROM products WHERE item_id=?', [thisOrder.item_id], function(err, results) {
			// if connection error
			if (err) {
				thisOrder.order_success = false;
				thisOrder.order_status = err;
				reject(err);
				return;
			}
			// if item_id yields no results
			if (results.length === 0) {
				console.log('no exist');
				thisOrder.order_success = false;
				thisOrder.order_status = "Item doesn't exist in database.";
				reject(thisOrder.order_status);
				return;
			}
			// if out of stock
			if (results[0].stock_quantity == null 
				|| results[0].stock_quantity === 0) {
					console.log('zero stock');
					thisOrder.order_success = false;
					thisOrder.order_status = 'Out of stock.';
					reject(thisOrder.order_status);
					return;
			}
			// if requested quantity is greater than what's in stock
			if (thisOrder.requested_quantity > results[0].stock_quantity) {
				console.log('insufficient stock');
				thisOrder.order_success = false;
				thisOrder.order_status = 'Insufficient stock.';
				reject(thisOrder.order_status);
				return;
			}

			// these values are updated after mysql query. default values set in paramters above.
			thisOrder.product_name = results[0].product_name;
			thisOrder.price = results[0].price;

			// calculated by multiplying price and requested_quantity
			thisOrder.total_cost = thisOrder.price * thisOrder.requested_quantity;

			console.log('before resolve', results[0]);
			// resolve parameters include the updated hash of thisOrder
			// and the query results (i.e. the most updated product data)
			resolve(thisOrder);
		});
	});
};

module.exports = BamazonOrder;