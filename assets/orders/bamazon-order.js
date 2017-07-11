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
	this.product_name = product_name;
	this.price = price;
	this.department_name = department_name;
	this.total_cost = total_cost;
	this.order_success = order_success;
	this.order_status = order_status;
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
				thisOrder.order_status = 'Server connection error';
				reject(thisOrder.order_status);
				return connection.end();
			}
			// if item_id yields no results
			if (results.length === 0) {
				thisOrder.order_success = false;
				thisOrder.order_status = "Item doesn't exist in database.";
				reject(thisOrder.order_status);
				return connection.end();
			}
			// if out of stock
			if (results[0].stock_quantity == null 
				|| results[0].stock_quantity === 0) {
					thisOrder.order_success = false;
					thisOrder.order_status = 'Out of stock.';
					reject(thisOrder.order_status);
					return connection.end();
			}
			// if requested quantity is greater than what's in stock
			if (thisOrder.requested_quantity > results[0].stock_quantity) {
				console.log('insufficient stock');
				thisOrder.order_success = false;
				thisOrder.order_status = 'Insufficient stock.';
				reject(thisOrder.order_status);
				return connection.end();
			}

			thisOrder.updateDatabase().then(function(){
				// these values are updated after mysql query. default values set in paramters above.
				thisOrder.product_name = results[0].product_name;
				thisOrder.price = results[0].price;
				thisOrder.department_name = results[0].department_name;
				thisOrder.order_success = true;
				thisOrder.order_status = 'Purchase successful!';

				// calculated by multiplying price and requested_quantity
				thisOrder.total_cost = thisOrder.price * thisOrder.requested_quantity;

				// resolve parameter is updated hash of thisOrder (called 'orderDetails' on point of use)
				resolve(thisOrder);

			// catch defaults to server connection error
			}).catch(function(){
				thisOrder.order_success = false;
				thisOrder.order_status = 'Server connection error';
				reject(thisOrder.order_status);
				return connection.end();
			});						
		}); // end of select query
	}); // end of Promise
}; // end of checkout()

BamazonOrder.prototype.updateDatabase = function () {	
	// saves 'this' object as more manageable variable
	const thisOrder = this;

	return new Promise(function(resolve, reject) {
		
		// creates a query string that sets the stock_quantity equal to the
		// current stock_quantity minus this order's requested_quantity
		// of the given item_id.
		let queryString = 'UPDATE products SET stock_quantity=stock_quantity-'
			+ thisOrder.requested_quantity + ' WHERE item_id=' + thisOrder.item_id;

		// updates database by subtracting current stock_quantity by requested_quantity
		connection.query(queryString, function(err, result){
				if (err) {
					reject();
					throw err;
				}

				console.log('changed ' + result.changedRows + ' rows');

				resolve();

				return connection.end();
			} // end of callback
		); // end of update query
	}); // end of Promise
}; // end of updateDatabase

module.exports = BamazonOrder;