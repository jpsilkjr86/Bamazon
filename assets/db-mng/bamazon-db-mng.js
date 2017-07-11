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

// database management Object to be exported
var bamazonDB = {
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