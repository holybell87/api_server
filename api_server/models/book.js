// DEPENDENCIES
const mongoose = require('mongoose');

// Define Schemes
const Schema = mongoose.Schema;
const bookSchema = new Schema({
	title: String,
	author: String,
	published_date: {
		type: Date,
		default: Date.now
	}
}, {
	// __v 제거 (versionKey)
	versionKey: false // You should be aware of the outcome after set to false
});

// Create Model & Export
module.exports = mongoose.model('tbl_books', bookSchema); //collection name : tbl_books