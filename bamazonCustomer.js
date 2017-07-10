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

connection.connect(function(err) {
	if (err) {
		console.log('error connecting: ' + err.stack);
		return;
	}

	console.log('connected as id ' + connection.threadId);

	// Display all available products (item_id, product_name, price)
	connection.query('SELECT ?? FROM products', [['item_id', 'product_name', 'price']], function(error, results){
		if (err) {
			connection.end();
			return console.log(err);
		}

		for (let i = 0; i < results.length; i++) {
			console.log('Item Id: ' + results[i].item_id 
				+ ' | ' + results[i].product_name
				+ ' | $' + results[i].price);
		}

		console.log('\nWelcome to Bamazon! What would you like to purchase today?\n');
		// Prompt 1: ask user to enter the item_id of the product they would like to purchase
		prompt([
		{
			type: 'input',
			message: 'Item ID:',
			name: 'requested_id',
			validate: function(str) {
				if (isNaN(str)) {
					console.log('\n\nPlease enter a valid number.\n');
					return false;
				}
				return true;
			},
			filter: function(str) {
				return parseInt(str.trim());
			}
		},{ 
		// Prompt 2: ask how many items they'd like to purchase
			type: 'input',
			message: 'Quantity:',
			name: 'requested_quantity',
			validate: function(str) {
				if (isNaN(str)) {
					console.log('\nPlease enter a valid number.\n');
					return false;
				}
				return true;
			},
			filter: function(str) {
				return parseInt(str.trim());
			}
		}
		]).then(function(answers){
			console.log(answers);
			connection.end();
		});

			// Query database

				// if requested_quantity > stock_quantity, display "Insufficient Stock" message

				// else calculate and display price to user, update db by subtracting from stock_quantity

	});	




	/* TEST QUERY -- SUCCESSFUL
	connection.query('SELECT * FROM products WHERE department_name="Toys"', function(error, results){
		if (err) {
			connection.end();
			return console.log(err);
		}

		console.log(results);
		connection.end();
	}); */
});