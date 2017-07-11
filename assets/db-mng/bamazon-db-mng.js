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
	// getTable receives a SQL queryStr and queryValAry as arguments, returns promise
	getTable: function(queryStr, queryValAry) {
		return new Promise(function(resolve, reject)  {
			connection.query(queryStr, queryValAry, function(err, res) {
				if (err) {
					return reject(err);
				}
				return resolve(res);
			});
		});
	},
	getProductById: function(productId) {
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
	},
	update: function(queryStr, queryValAry) {
		// update returns promise which handles resolve / reject upon completion
		return new Promise(function(resolve, reject) {
			// updates database by subtracting current stock_quantity by requested_quantity
			connection.query(queryStr, queryValAry, function(err, result){
				if (err) {
					return reject('Server connection error.');
				}

				console.log(result);

				return resolve('changed ' + result.changedRows + ' rows');
			}); // end of query
		}); // end of promise
	}, // end of update()
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