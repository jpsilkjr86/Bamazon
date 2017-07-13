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
					return resolve(res[0]);
				});
			});
		}, // end of getById()
		transaction: function(item_id, requested_quantity) {
			// returns promise which handles resolve / reject upon completion
			return new Promise(function(resolve, reject) {
				// instantiates locally scoped query string. extra condition
				// 'AND stock_quantity-?>=0' ensures the function will not reduce stock to 
				// a negative number at the point of sale.
				let queryStr = 'UPDATE products SET stock_quantity = stock_quantity - ?,'
				 + ' product_sales = product_sales + (price * ?)'
				 + ' WHERE item_id=? AND stock_quantity - ? >= 0'
				// updates database by subtracting current stock_quantity by requested_quantity
				connection.query(
					queryStr,
					[requested_quantity, requested_quantity, item_id, requested_quantity],
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
		}, // end of products.transaction()
		// function to add stock to existing products in inventory
		addStock: function(item_id, qty_to_increase) {
			// returns promise which handles resolve / reject upon completion
			return new Promise(function(resolve, reject) { 
				// updates database by adding current stock_quantity qty_to_increase
				connection.query(
					'UPDATE products SET stock_quantity=stock_quantity+? WHERE item_id=?',
					[qty_to_increase, item_id],
					function(err, res){					
						if (err) {
							return reject('Server connection error.');
						}
						if (res.changedRows === 0) {
							return reject('Unable to locate product.');
						}
						return resolve('changed ' + res.changedRows + ' row(s)!');
					} // end of callback
				); // end of query
			}); // end of Promise
		}, // end of products.addStock()
		// function to add new products
		addNew: function(product_name, department_name, price, stock_quantity) {
			// returns promise
			return new Promise(function(resolve, reject) {
				let queryString = 'INSERT INTO products (product_name, department_name,'
					+ ' price, stock_quantity) VALUES (?)';
				let queryValAry = [[product_name, department_name, price, stock_quantity]];
				// matches arguments with query string
				connection.query(queryString, queryValAry, function(err, res){
					if (err) {
						return reject('Server processing error.');
					}
					if (res.affectedRows === 0) {
						return reject('Server processing error.')
					}
					return resolve('inserted ' + res.affectedRows + ' row(s)!');
				});
			}); // end of Promise
		} // end of products.addNew()
	}, // end of bamazonDB.products subset object	
	departments: {
		viewProductSales: function() {
			return new Promise(function(resolve, reject)  {
				// first declares a query string which accomplishes the following:
				// creates (or replaces if exists) a new view (virtual table) called
				// department_revenue, which is composed of columns department_name and a
				// column called total_product_sales which is the sum of product_sales
				// grouped by department name (all coming from the table 'products').
				let createViewQuery = 'CREATE OR REPLACE VIEW department_revenue AS'
					+ ' SELECT department_name, SUM(product_sales) AS total_product_sales'
					+ ' FROM products GROUP BY department_name';

				connection.query(createViewQuery, function(err, res) {
					// if connection error
					if (err) {
						return reject('Server connection error');
					}
					// if item_id yields no results
					if (res.length === 0) {
						return reject("No results for query");
					}
					// creating the above view first allows for next-level calculations using
					// the values in the alias column total_product_sales created and saved in the
					// view. The query below calculates total_profit by subtracting
					// over_head_costs from total_product_sales column, the latter values of which
					// are only accessible in the department_revenue view.
					let salesTableQuery = 'SELECT d.department_name, d.over_head_costs,'
						+ ' t.total_product_sales,'
						+ ' (t.total_product_sales - d.over_head_costs) AS total_profit'
						+ ' FROM departments AS d'
						+ ' LEFT JOIN department_revenue AS t'
						+ ' ON d.department_name=t.department_name'
						+ ' ORDER BY department_name';

					connection.query(salesTableQuery, function(err, res) {
						// if connection error
						if (err) {
							return reject('Server connection error');
						}
						// if item_id yields no results
						if (res.length === 0) {
							return reject("No results for query");
						}
						return resolve(res);
					});
				});
			});
		}, // end of departments.viewProductSales()
		addNew: function(department_name, over_head_costs) {
			// returns promise
			return new Promise(function(resolve, reject) {
				let queryString = 'INSERT INTO departments (department_name,'
					+ ' over_head_costs) VALUES (?)';
				let queryValAry = [[department_name, over_head_costs]];
				// matches arguments with query string
				connection.query(queryString, queryValAry, function(err, res){
					if (err) {
						return reject('Server processing error.');
					}
					if (res.affectedRows === 0) {
						return reject('Server processing error.')
					}
					return resolve('inserted ' + res.affectedRows + ' row(s)!');
				});
			}); // end of Promise
		} // end of departments.addNew()
	}, // end of bamazonDB.departments subset object
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