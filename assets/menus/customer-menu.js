// imports inquirer npm, creates prompt
var inquirer = require('inquirer');
var prompt = inquirer.createPromptModule();

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

// customerMenu object, to be exported as a module
var customerMenu = {
	// initialization method for customerMenu -- 
	// checks if server connection can be established before proceeding.
	initialize: function() {
		// attempts connection to mysql server. if it fails, program ends.
		// else, goes to customerMenu.main()
		connection.connect(function(err) {
			if (err) {
				console.log('Error connecting to Bamazon: ' + err.stack);
				return;
			}
			// proceeds to customerMenu.main() if connection is successful
			console.log('connected as id ' + connection.threadId
				+ '\n\n*************** Welcome to Bamazon! ***************\n');
			customerMenu.main();
		});
	}, // end of customerMenu.intitialize()

	// main menu function
	main: function() {

		console.log('\n======= MAIN MENU =======\n');

		prompt([
		{
			type: 'list',
			message: 'What can I help you with today?',
			choices: ['I would like to purchase an item.', 'Quit'],
			name: 'mainMenuChoice'
		}
		]).then(function(answers){

			if (answers.mainMenuChoice === 'I would like to purchase an item.') {
				// proceeds to purchase menu
				customerMenu.purchase.main();
			}

			if (answers.mainMenuChoice === 'Quit') {
				// proceeds to quit
				customerMenu.quit();
			}				
		});
	}, // end of customerMenu.main()

	// purchase subset object
	purchase: {		
		// customerMenu.purchase.main() is the menu for making a purchase
		main: function() {

			console.log('\n======= PURCHASE MENU =======\n'
				+ '\nPlease select from the following options:\n');

			prompt([
			{
				type: 'list',
				message: 'You can...',
				choices: ['List all items and make a purchase.', 
					'Browse items by department.'
					'Return to the main menu.'],
				name: 'purchaseMenuChoice'
			}
			]).then(function(answers){
				// proceed to the next step according to the user's choice
				if (answers.purchaseMenuChoice === 'List all items and make a purchase.') {
					customerMenu.purchase.listAllAndBuy();
				}

				if (answers.purchaseMenuChoice === 'Browse items by department.') {
					customerMenu.purchase.browseByDept();
				}

				if (answers.purchaseMenuChoice === 'Return to the main menu.') {
					customerMenu.main();
				}
			});
		}, // end of customerMenu.purchase.main()

		// prompt for listing all items on Bamazon and purchasing by id
		listAllAndBuy: function() {
			console.log('\n======= ALL ITEMS =======\n');
			// Display all available products (item_id, product_name, price)
			connection.query('SELECT ?? FROM products', [['item_id', 'product_name', 'price']], function(error, results){
				if (error) {
					connection.end();
					return console.log(error);
				}

				for (let i = 0; i < results.length; i++) {
					console.log('Item Id: ' + results[i].item_id 
						+ ' | ' + results[i].product_name
						+ ' | $' + results[i].price);
				}

				console.log('\nWhat would you like to purchase today?\n');
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

					customerMenu.main();
					// find the desired item. if it doesn't exist, return.




					connection.end();
				});

					// Query database

						// if requested_quantity > stock_quantity, display "Insufficient Stock" message

						// else calculate and display price to user, update db by subtracting from stock_quantity

			});	

		}, // end of customerMenu.purchase.listAllAndBuy()

		// menu for browsing by department
		browseByDept: function() {
			console.log('\n======= BROWSE BY DEPARTMENT =======\n' 
				+ '"Browse by Department" feature still under construction.'
				+ '\nReturning to the main menu...\n');
			customerMenu.main();
		}
	}, // end of customerMenu.purchase subset object

	// function for quitting the customer menu
	quit: function() {
		console.log('\nThank you for shopping with Bamazon! Good bye...\n');
		connection.end()
		return;
	} // end of customerMenu.quit()
	
}; // end of customerMenu object

module.exports = customerMenu;