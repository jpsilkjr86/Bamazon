var mysql = require('mysql');
var keys = require('./keys.js');
var inquirer = require('inquirer');
var prompt = inquirer.createPromptModule();

var connection = mysql.createConnection({
	host: 'localhost',
	port: 3306,
	user: 'root',
	password: keys.pw.mysqlpw,
	database: 'bamazon'
});

console.log('password retrieval status: ' + keys.pw.status);

connection.connect(function(err) {
	if (err) {
		console.log('error connecting: ' + err.stack);
		return;
	}

	console.log('connected as id ' + connection.threadId);

	connection.query('SELECT * FROM products WHERE department_name="Toys"', function(error, results){
		if (err) {
			console.log(err);
			return;
		}

		console.log(results);
		connection.end();
	});
});