// imports inquirer npm, creates prompt
const inquirer = require('inquirer');
const prompt = inquirer.createPromptModule();

// imports Table constructor from cli-table npm
let Table = require('cli-table');

// imports custom modules. bamazonDB for back-end database mng,
// BamazonOrder for constructor of new orders
const bamazonDB = require('../db-mng/bamazon-db-mng.js');
const BamazonOrder = require('../orders/bamazon-order.js');

// customerMenu object, to be exported as a module
const customerMenu = {
	// initialization method for customerMenu -- 
	// checks if Bamazon server connection can be established before proceeding.
	initialize: function() {
		// attempts connection to mysql server. if it fails, program ends.
		// else, goes to customerMenu.main()
		bamazonDB.connect().then(function(connectMsg){
			// proceeds to customerMenu.main() if connection is successful
			console.log('\n' + connectMsg + 
				'\n\n*************** Welcome to Bamazon! ***************\n');
			return customerMenu.main();
		}).catch(function(errMsg){
			return console.log(errMsg);
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
				return customerMenu.purchase.main();
			}

			if (answers.mainMenuChoice === 'Quit') {
				// proceeds to quit
				return customerMenu.quit();
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
					'Browse items by department.',
					'Return to the main menu.'],
				name: 'purchaseMenuChoice'
			}
			]).then(function(answers){
				// proceed to the next step according to the user's choice
				if (answers.purchaseMenuChoice === 'List all items and make a purchase.') {
					return customerMenu.purchase.listAllAndBuy();
				}

				if (answers.purchaseMenuChoice === 'Browse items by department.') {
					return customerMenu.purchase.browseByDept();
				}

				if (answers.purchaseMenuChoice === 'Return to the main menu.') {
					return customerMenu.main();
				}
			});
		}, // end of customerMenu.purchase.main()

		// prompt for listing all items on Bamazon and purchasing by id
		listAllAndBuy: function() {
			// sends SQL query string and values array to bamazonDB.query()
			// Displays all available products (item_id, product_name, price)
			bamazonDB.query(
				'SELECT ?? FROM products',
				[['item_id', 'product_name', 'price']]
			// receives products from promise resolve 
			).then(function(products){

				console.log('\n ======= BROWSE ALL ITEMS ======= \n');

				let table = new Table({
					head: ['Item ID', 'Product Name', 'Price'],
					// colWidths: [10, 60, 10],
					chars: { 'top': '═' , 'top-mid': '╤' , 'top-left': '╔' , 'top-right': '╗'
			         , 'bottom': '═' , 'bottom-mid': '╧' , 'bottom-left': '╚' , 'bottom-right': '╝'
			         , 'left': '║' , 'left-mid': '╟' , 'mid': '─' , 'mid-mid': '┼'
			         , 'right': '║' , 'right-mid': '╢' , 'middle': '│' }
				});

				// loops through products and pushes info onto cli-table
				for (let i = 0; i < products.length; i++) {
					table.push([
						products[i].item_id, products[i].product_name, '$' + products[i].price
					]);
				}
				// converts table to a string
				console.log(table.toString());

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
						if (parseInt(str) < 1) {
							console.log('\n\nInputs must be greater than zero.\n');
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
						if (parseInt(str) < 1) {
							console.log('\n\nInputs must be greater than zero.\n');
							return false;
						}
						return true;
					},
					filter: function(str) {
						return parseInt(str.trim());
					}
				}
				// promise resolve handler for prompt
				]).then(function(answers){

					// starts a newOrder object
					const newOrder = 
						new BamazonOrder(answers.requested_id, answers.requested_quantity);

					// checkout function returns a promise.
					newOrder.checkout().then(function(orderDetails){
						// if the checkout is successful, then do this
						console.log('\nYour purchase was successful!\n'
							+ '\n ******* ORDER DETAILS: ******* \n'
							+ '\nItem ID: ' + orderDetails.item_id
							+ '\nProduct: ' + orderDetails.product_name
							+ '\nDepartment: ' + orderDetails.department_name
							+ '\nUnit Price: ' + orderDetails.price
							+ '\nQuantity: ' + orderDetails.requested_quantity
							+ '\nPurchase Total: ' + orderDetails.total_cost);

						return customerMenu.main();

					}).catch(function(failureMessage){
						// if the checkout was unsuccessful, display reason, return to main menu
						console.log("\nWe're sorry, but we were unable to process your purchase.\n"
							+ '\nReason for failure: ' + failureMessage + '\n');

						return customerMenu.main();
					});  // end of newOrder.checkout() 
				}); // end of prompt()
			}).catch(function(errMsg){
				return console.log(errMsg);
			}); // end of query promise handlers
		}, // end of customerMenu.purchase.listAllAndBuy()

		// menu for browsing by department
		browseByDept: function() {
			console.log('\n======= BROWSE BY DEPARTMENT =======\n' 
				+ '\n"Browse by Department" feature still under construction.'
				+ '\nReturning to the main menu...\n');
			return customerMenu.main();
		}
	}, // end of customerMenu.purchase subset object

	// function for quitting the customer menu
	quit: function() {
		// handles promise returned from bamazonDB.quit()
		bamazonDB.quit().then(function(){
			return console.log('\nThank you for shopping with Bamazon! Good bye...\n');
		}).catch(function(errMsg){
			return console.log(errMsg);
		});
	} // end of customerMenu.quit()
	
}; // end of customerMenu object

module.exports = customerMenu;