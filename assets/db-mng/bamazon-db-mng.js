// imports keys for password validation
const keys = require('../keys/keys.js');

// imports mysql npm and establishes connection
const mysql = require('mysql');
const connection = mysql.createConnection({
	host: 'localhost',
	port: 3306,
	user: 'root',
	password: keys.pw.mysqlpw,
	database: 'bamazon'
});

// database management Object to be exported
let bamazonDB = {
	// asyncrhounous method returning Promise with success/fail messages
	connect: function() {		
		return new Promise(function(resolve, reject) {
			// attempts connection to mysql server. 
			connection.connect(function(err) {
				if (err) {
					return reject('Error connecting to Bamazon: ' + err.stack);
				}
				// returns resolve if connection is successful
				return resolve('connected as id ' + connection.threadId);
			});
		});			
	}, // end of bamazonDB.connect
	// simple SQL query method, receives a SQL queryStr & queryValAry as arguments, returns promise
	query: function(queryStr, queryValAry) {
		// promise which handles resolve / reject upon completion
		return new Promise(function(resolve, reject)  {
			connection.query(queryStr, queryValAry, function(err, res) {
				if (err) {
					return reject('Server connection error');
				}
				return resolve(res);
			});
		});
	}, // end of bamazonDB.query()
	products: {
		getById: function(productId) {
			return new Promise(function(resolve, reject)  {
				connection.query('SELECT * FROM products WHERE item_id=' + productId, function(err, res) {
					// if connection error
					if (err) {
						return reject('Server connection error');
					}
					// if item_id yields no results
					if (res.length === 0) {
						return reject("Item doesn't exist in database.");
					}
					// if out of stock
					if (res[0].stock_quantity == null
						|| res[0].stock_quantity === 0) {
							return reject('Out of stock.');
					}
					return resolve(res[0]);
				});
			});
		}, // end of getById()
		reduceStockBy: function(item_id, requested_quantity) {
			// returns promise which handles resolve / reject upon completion
			return new Promise(function(resolve, reject) {
				// instantiates locally scoped query string. extra condition
				// 'AND stock_quantity-?>=0' ensures the function will not reduce stock to 
				// a negative number at the point of sale.
				let queryStr = 'UPDATE products SET stock_quantity=stock_quantity-?'
				 + ' WHERE item_id=? AND stock_quantity-?>=0'
				// updates database by subtracting current stock_quantity by requested_quantity
				connection.query(
					queryStr,
					[requested_quantity, item_id, requested_quantity],
					function(err, result){					
						if (err) {
							return reject('Server connection error.');
						}
						if (result.changedRows === 0) {
							return reject ('Insufficient stock.')
						}
						return resolve('changed ' + result.changedRows + ' rows');
					} // end of callback
				); // end of query
			}); // end of Promise
		}, // end of products.reduceStockBy()
		addStock: function(item_id, qty_to_increase) {
			// returns promise which handles resolve / reject upon completion
			return new Promise(function(resolve, reject) { 
				// updates database by adding current stock_quantity qty_to_increase
				connection.query(
					'UPDATE products SET stock_quantity=stock_quantity+? WHERE item_id=?',
					[qty_to_increase, item_id],
					function(err, result){					
						if (err) {
							return reject('Server connection error.');
						}
						if (result.changedRows === 0) {
							return reject (result);
						}
						return resolve('changed ' + result.changedRows + ' rows');
					} // end of callback
				); // end of query
			}); // end of Promise
		}
	}, // end of bamazonDB.products subset object		
	quit: function() {
		return new Promise(function(resolve, reject) {
			// attempts connection to mysql server. 
			connection.end(function(err) {
				if (err) {
					return reject('Error disconnencting: ' + err.stack);
				}
				// returns resolve if connection is successful
				return resolve();
			});
		});
	} // end of bamazonDB.quit
};


module.exports = bamazonDB;