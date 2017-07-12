// imports bamazonDB for mysql query functionality
const bamazonDB = require('../db-mng/bamazon-db-mng.js');

let BamazonOrder = function (item_id=0, requested_quantity=0, product_name='', price=0, 
	department_name='', total_cost=0, order_success=false, order_status=null) {
	
	// these are the first items that will be received
	this.item_id = item_id;
	this.requested_quantity = requested_quantity;
	this.product_name = product_name;
	this.price = price;
	this.department_name = department_name;
	this.total_cost = total_cost;
	this.order_success = order_success;
	this.order_status = order_status;
};


BamazonOrder.prototype.checkout = function () {
	// saves 'this' object as more manageable variable
	const thisOrder = this;
	// checkout returns a promise. two conditions must be met which require asynchronous handling: 
	//    1) product is able to be found in the database, after which
	//    2) the database is able to successfully update the database without error or 
	//        resulting in negative stock_quantity
	return new Promise(function(resolve, reject) {
		// checkout continues if it's able to retrieve product info from database if it's in stock
		bamazonDB.products.getById(thisOrder.item_id).then(function(product) {			
			// if product is out of stock, do not proceed
			if (product.stock_quantity == null || product.stock_quantity === 0) {
				return reject('Out of stock.');
			}
			// if product.stock_quantity < thisOrder.requested_quantity, do not proceed
			if (product.stock_quantity < thisOrder.requested_quantity) {
				return reject('Insufficient stock.');
			}
			// updates products table in database after successfully retrieving 
			// product info and if product is available.
			bamazonDB.products.transaction(
				thisOrder.item_id, thisOrder.requested_quantity
			).then(function(){
				// these values are updated after mysql query. default values set in paramters above.
				thisOrder.product_name = product.product_name;
				thisOrder.price = product.price;
				thisOrder.department_name = product.department_name;
				thisOrder.order_success = true;
				thisOrder.order_status = 'Purchase successful!';

				// calculated by multiplying price and requested_quantity
				thisOrder.total_cost = thisOrder.price * thisOrder.requested_quantity;

				// resolve parameter is updated hash of thisOrder (called 'orderDetails' on point of use)
				return resolve(thisOrder);
			// catch defaults to server connection error
			}).catch(function(failureMessage){
				return reject(failureMessage);
			});	// end of products.transaction() promise
		}).catch(function(failureMessage){
			// passes failureMessage parameter from one promise to the next
			return reject(failureMessage);
		}); // end of products.getById() promise
	}); // end of returned Promise
}; // end of checkout()

module.exports = BamazonOrder;