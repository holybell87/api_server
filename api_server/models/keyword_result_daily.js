/**
 * schema는 document의 구조가 어떻게 생겼는지 알려주는 역할을 한다.
 * SchemaType 8가지 : String, Number, Date, Buffer, Boolean, Mixed, Objectid, Array
 * 사용 메뉴얼 : http://mongoosejs.com/docs/schematypes.html
 * 
   --------------------------------------------------------------------------------------------------------
   [Mongoose Schema는 다음의 Data type을 지원한다.]
   --------------------------------------------------------------------------------------------------------
   Data Type				Description
   --------------------------------------------------------------------------------------------------------
   String					표준 자바스크립트와 Node.js의 문자열 type
   Number					표준 자바스크립트와 Node.js의 숫자 type
   Boolean					표준 자바스크립트와 Node.js의 불리언 type
   Buffer					Node.js의 binary type(이미지, PDF, 아카이브 등)
   Date						ISODate format data type(2016-08-08T12:52:30:009Z)
   Array					표준 자바스크립트와 Node.js의 배열 type
   Schema.types.ObjectId	12byte binary 숫자에 대한 MongoDB 24자리 hex 문자열(501d86090d371bab2c0341c5)
   Schema.types.Mixed		모든 유형의 데이터
   --------------------------------------------------------------------------------------------------------

	https://mongoosejs.com/docs/queries.html
	Model.deleteMany()
	Model.deleteOne()
	Model.find()
	Model.findById()
	Model.findByIdAndDelete()
	Model.findByIdAndRemove()
	Model.findByIdAndUpdate()
	Model.findOne()
	Model.findOneAndDelete()
	Model.findOneAndRemove()
	Model.findOneAndUpdate()
	Model.replaceOne()
	Model.updateMany()
	Model.updateOne()
*/

// DEPENDENCIES
const mongoose = require('mongoose');

// Define Schemes
const Schema = mongoose.Schema;
const keywordResultDailySchema = new Schema({
	start_date: String,
	keyword: String,
	frep: Number,
	reckey_cnt: Number
}, {
	// __v 제거 (versionKey)
	versionKey: false // You should be aware of the outcome after set to false

	// Mongoose 에선 컬렉션을 만들면 자동으로 끝에 's'를 붙여주게 되는데,
	// 이렇게 만들지 않을려면 schema 를 정의하면서 컬렉션명을 넣어주면 된다.
	, collection : 'tbl_mt_keyword_result'
});


// query middleware
keywordResultDailySchema.pre('find', function() {
	//console.log(this instanceof mongoose.Query); // true
	const utility = require('../commons/utility');
	const currentTime = utility.getCurrentTime('YYYY-MM-DD HH:mm:ss');
	console.log('[tbl_mt_keyword_result] 쿼리시작시간 (find) : ' + currentTime);

	this.start = Date.now(); // 쿼리시작시간
});

keywordResultDailySchema.post('find', function(result) {
	//console.log(this instanceof mongoose.Query); // true

	// prints returned documents
	//console.log('find() returned ' + JSON.stringify(result)); // 데이터 조회 결과 데이터

	// prints number of milliseconds the query took
	//console.log('쿼리소요시간 : findOne() took ' + (Date.now() - this.start) + ' millis');

	const utility = require('../commons/utility');
	const currentTime = utility.getCurrentTime('YYYY-MM-DD HH:mm:ss');
	console.log('[tbl_mt_keyword_result] 쿼리종료시간 (find) : ' + currentTime);

	const operTime = (Date.now() - this.start) / 1000; // sec
	console.log('[tbl_mt_keyword_result] 쿼리소요시간 (find) : ' + operTime.toFixed(2) + ' sec');
});

// Create Model & Export
module.exports = mongoose.model('tbl_mt_keyword_result', keywordResultDailySchema); //collection name : tbl_mt_keyword_result