/*
----------------------------------------------------------------------
[ROUTE]						[METHOD]	[DESCRIPTION]
----------------------------------------------------------------------
/api/books					GET			모든 book 데이터 조회
/api/books/:book_id			GET			 _id 값으로 데이터 조회
/api/books/author/:author	GET			author 값으로 데이터 조회
/api/books					POST		book 데이터 생성
/api/books/:book_id			PUT			book 데이터 수정
/api/books/:book_id			DELETE		book 데이터 제거
----------------------------------------------------------------------
*/

// DEPENDENCIES
const log4 = require('../../config/log4');
const res_builder = require('../../commons/response_builder');

const logger = log4.getLogger('index');

module.exports = function(app, Book)
{
	// GET ALL BOOKS
	app.get('/api/books', function(req,res) {
		Book.find(function(err, books) {
			if(err) return res.status(500).send({error: 'database failure'});
			//res.json(books);
			res.json(
				res_builder.success( books )
			);
		})
	});

	// GET SINGLE BOOK
	app.get('/api/books/:book_id', function(req, res) {
		Book.findOne({_id: req.params.book_id}, function(err, book) {
			if(err) return res.status(500).json({error: err});
			if(!book) return res.status(404).json({error: 'book not found'});
			res.json(
				res_builder.success( book )
			);
		})
	});

	// GET BOOK BY AUTHOR
	app.get('/api/books/author/:author', function(req, res) {
		Book.find({author: req.params.author}, {_id: 0, title: 1, published_date: 1},  function(err, books) {
			if(err) return res.status(500).json({error: err});
			if(books.length === 0) return res.status(404).json({error: 'book not found'});
			res.json(
				res_builder.success( books )
			);
		})
	});

	// CREATE BOOK
	app.post('/api/books', function(req, res) {
		let book = new Book();
		book.title = req.body.title;
		book.author = req.body.author;
		//book.published_date = new Date(req.body.published_date);
		book.published_date = Date.now;

		book.save(function(err) { //insert는 _id가 있어도 같은 동작을 하지만 , save는 중복체크를하여 _id가 있으면 update
			if(err) {
				console.error(err);
				res.json({result: 0});
				return;
			}

			res.json({result: 1});

		});
	});

	// UPDATE THE BOOK
	app.put('/api/books/:book_id', function(req, res) {
		console.log(req.params);

		Book.update({ _id: req.params.book_id }, { $set: req.body }, function(err, output) {
			if(err) res.status(500).json({ error: 'database failure' });
			console.log(output);
			if(!output.n) return res.status(404).json({ error: 'book not found' });
			res.json( { message: 'book updated' } );
		})
	/* [ ANOTHER WAY TO UPDATE THE BOOK ]
			Book.findById(req.params.book_id, function(err, book) {
			if(err) return res.status(500).json({ error: 'database failure' });
			if(!book) return res.status(404).json({ error: 'book not found' });
			if(req.body.title) book.title = req.body.title;
			if(req.body.author) book.author = req.body.author;
			if(req.body.published_date) book.published_date = req.body.published_date;
			book.save(function(err) {
				if(err) res.status(500).json({error: 'failed to update'});
				res.json({message: 'book updated'});
			});
		});
	*/
	});

	// DELETE BOOK
	app.delete('/api/books/:book_id', function(req, res) {
		Book.remove({ _id: req.params.book_id }, function(err, output) {
			if(err) return res.status(500).json({ error: "database failure" });

			/* ( SINCE DELETE OPERATION IS IDEMPOTENT, NO NEED TO SPECIFY )
			if(!output.result.n) return res.status(404).json({ error: "book not found" });
			res.json({ message: "book deleted" });
			*/

			res.status(204).end();
		})
	});
}