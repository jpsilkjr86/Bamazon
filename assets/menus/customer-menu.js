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
		console.log('\n ======= MAIN MENU =======\n');
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
			console.log('\n ======= PURCHASE MENU =======\n'
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
				// proceeds to the next step according to the user's choice
				switch(answers.purchaseMenuChoice) {
					case 'List all items and make a purchase.':
						customerMenu.purchase.listAllAndBuy();
						break;
					case 'Browse items by department.':
						customerMenu.purchase.browseByDept();
						break;
					case 'Return to the main menu.':
						customerMenu.main();
						break;
				}
				return;
			});
		}, // end of customerMenu.purchase.main()
		// prompt for listing all items on Bamazon and purchasing by id
		listAllAndBuy: function() {
			// sends SQL query string and values array to bamazonDB.query()
			// Displays all available products (item_id, product_name, price)
			bamazonDB.query(
				'SELECT ?? FROM products',
				[['item_id', 'product_name', 'price']]
			// promise for bamazon.query()
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

				// returns prompt as a promise in order to continue single promise chain
				return prompt([
				{ // Q1: ask user to enter the item_id of the product they would like to purchase
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
				},{ // Q2: ask how many items they'd like to purchase
					type: 'input',
					message: 'Quantity:',
					name: 'requested_quantity',
					validate: function(str) {
						if (isNaN(str)) {
							console.log('\nPlease enter a valid number.\n');
							return false;
						}
						if (parseInt(str) < 0) {
							console.log('\n\nInput may not be less than zero.\n');
							return false;
						}
						return true;
					},
					filter: function(str) {
						return parseInt(str.trim());
					}
				}]); // end of returned prompt parameters
			// promise for prompt
			}).then(function(answers){
				// if requested quantity is zero, throws an error so that the
				// promise chain jumps directly to catch handler.
				if (answers.requested_quantity === 0) {
					throw 'Requested quantiy is zero.';
				}
				// starts a newOrder object using the answers from the previous prompt
				const newOrder = 
					new BamazonOrder(answers.requested_id, answers.requested_quantity);
				// return newOrder.checkout() as a promise.
				return newOrder.checkout();
			// promise for newOrder.checkout()
			}).then(function(orderDetails){
				// if all the promises in the chain are resolved, then do this
				console.log('\nYour purchase was successful!\n'
					+ '\n ******* ORDER DETAILS: ******* \n'
					+ '\nItem ID: ' + orderDetails.item_id
					+ '\nProduct: ' + orderDetails.product_name
					+ '\nDepartment: ' + orderDetails.department_name
					+ '\nUnit Price: ' + orderDetails.price
					+ '\nQuantity: ' + orderDetails.requested_quantity
					+ '\nPurchase Total: ' + orderDetails.total_cost);
				// return to main menu at the end of the promise resolve chain
				return customerMenu.main();
			// error handler for all chained promises
			}).catch(function(errMsg){
				// if the checkout was unsuccessful, display reason, return to main menu
				console.log("\nWe're sorry, but we were unable to process your purchase.\n"
					+ '\nReason: ' + errMsg + '\n');
				return customerMenu.main();
			});  // end of all chained promises
		}, // end of customerMenu.purchase.listAllAndBuy()
		// menu for browsing by department
		browseByDept: function() {
			console.log('\n ======= BROWSE BY DEPARTMENT =======\n');
			// gets list of all departments from database for use in prompt
			bamazonDB.query(
				'SELECT DISTINCT ?? FROM ?? WHERE stock_quantity > 0',
				['department_name', 'products']
			).then(function(results){
				// declares a locally scoped departments array
				let departments = [];
				// loops through results and pushes each department name onto the array
				for (let i = 0; i < results.length; i++) {
					departments.push(results[i].department_name);
				}
				// creates prompt of type list dynamically from departments array
				// and returns the prompt as a promise.
				return prompt([{
					type: 'list',
					message: 'Please select a department from the list.',
					choices: departments,
					name: 'department_name'
				}]);
			// promise for prompt
			}).then(function(answers){
				// declares locally scoped query string
				let productsQuery = 'SELECT item_id, product_name FROM products'
					+ ' WHERE department_name = ?';
				// returns bamazonDB.query, itself a promise.
				return bamazonDB.query(productsQuery, [answers.department_name]);
			// promise for bamazonDB query about products
			}).then(function(results){
				// declares a locally scoped products array
				let products = [];
				// loops through results and pushes each department name onto the array
				for (let i = 0; i < results.length; i++) {
					products.push(
						'ID: ' + results[i].item_id + ': ' + results[i].product_name);
				}
				// push option for 'Return to Main Menu' at end of array
				products.push('Return to Main Menu');
				// creates prompt of type list dynamically from products array
				// and returns the prompt as a promise.
				 return prompt([{
					type: 'list',
					message: 'Please select a product.',
					choices: products,
					name: 'product'
				}]);
			// promise for prompt
			}).then(function(answers){
				// throws an error if user chose to return to the main menu so that program
				// jumps immediately to catch function at bottom of the promise chain
				if (answers.product === 'Return to Main Menu') {
					throw 'Return to Main Menu';
				}
				// gets requested_id by searching the substring of answers.product from character 
				// index [4] to the index of the first colon 
				let indexOfColon = answers.product.search(':');
				let requested_id = parseInt(answers.product.substr(4, indexOfColon));

				let qtyPrompt = prompt([{
					type: 'input',
					message: 'How many items would you like? ',
					name: 'requested_quantity',
					validate: function(str) {
						if (isNaN(str)) {
							console.log('\nPlease enter a valid number.\n');
							return false;
						}
						if (parseInt(str) < 0) {
							console.log('\n\nInput may not be less than zero.\n');
							return false;
						}
						return true;
					},
					filter: function(str) {
						return parseInt(str.trim());
					}
				}]);
				return Promise.all([requested_id, qtyPrompt]);
			}).then(function(productRequests){
				// parameters correspond to Promise.all parameters. the first is just a value
				// passed along, the second is the answers object from the qtyPrompt.
				let requested_id = productRequests[0];
				let requested_quantity = productRequests[1].requested_quantity;

				// if requested quantity is zero, throws an error so that the
				// promise chain jumps directly to catch handler.
				if (requested_quantity === 0) {
					throw 'Requested quantiy is zero.';
				}
				// starts a newOrder object using the obtained user inputs
				const newOrder = 
					new BamazonOrder(requested_id, requested_quantity);
				// returns newOrder.checkout() as a promise.
				return newOrder.checkout();
			// promise for newOrder.checkout()
			}).then(function(orderDetails){
				// if all the promises in the chain are resolved, then do this
				console.log('\nYour purchase was successful!\n'
					+ '\n ******* ORDER DETAILS: ******* \n'
					+ '\nItem ID: ' + orderDetails.item_id
					+ '\nProduct: ' + orderDetails.product_name
					+ '\nDepartment: ' + orderDetails.department_name
					+ '\nUnit Price: ' + orderDetails.price
					+ '\nQuantity: ' + orderDetails.requested_quantity
					+ '\nPurchase Total: ' + orderDetails.total_cost);
				// return to main menu at the end of the promise resolve chain
				return customerMenu.main();
			// error handler for all promises in the chain			
			}).catch(function(errMsg){
				if (errMsg === 'Return to Main Menu') {
					console.log('\nReturning to Main Menu...\n');
					return customerMenu.main();
				}
				console.log("\nWe're sorry, but we were unable to complete your purchase.\n"
						+ '\nReason: ' + errMsg + '\n');
				return customerMenu.main();
			}); // end of chained promises
		} // end of browseByDept()
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