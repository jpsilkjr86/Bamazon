// imports inquirer npm, creates prompt
var inquirer = require('inquirer');
var prompt = inquirer.createPromptModule();

var customerMenu = {
	// main menu function
	main: function() {
		
		console.log('\n******* Welcome to Bamazon! *******\n');

		prompt([
		{
			type: 'list',
			message: 'What can I help you with today?',
			choices: ['I would like to purchase an item.'],
			name: 'mainMenuChoice'
		}
		]).then(function(answers){
			// proceed to next menu
			customerMenu.purchase.main();
		});
	},
	// purchase subset object
	purchase: {
		// customerMenu.purchase.main() is the menu for making a purchase
		main: function() {
			console.log('\nGreat! Please select from the following options:\n');

			prompt([
			{
				type: 'list',
				message: 'You can...',
				choices: ['List all items and make a purchase.', 'Browse items by department.'],
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
			});
		},
		// prompt for listing all items on Bamazon and purchasing by id
		listAllAndBuy: function() {
			console.log('list all and buy');
		},
		// menu for browsing by department
		browseByDept: function() {
			console.log('browse by dept');
		}
	}
};

module.exports = customerMenu;