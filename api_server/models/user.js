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
const userSchema = new Schema({
	user_id: {
		type: String, 
		//required: true,
		required:[true, 'user_id is required!'], // [true/false, 에러 메시지]
		match:[/^.{4,12}$/,'Should be 4-12 characters!'], // '/' : regex는 '/' 안에 작성, '^' 문자열의 시작, '$' 문자열의 끝, '.' 어떠한 문자열이라도 상관 없음, {4, 12} 4이상 12이하의 길이
		minlength: 1,
		trim: true,
		unique: true
	},
	user_name: {
		type: String, 
		required: true,
		minlength: 1,
		trim: true
	},
	user_password: {
		type: String,
		require: true,
		minlength: 6,
		//select:false // false로 두어 User.find할 때 보이지 않음. select({password: 1})을 통해 user에 추가되도록 함.
	},
	authority: {
		type: String,
		require: true,
		minlength: 1
	},
	/*email:{
		type:String,
		match:[/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,'Should be a vaild email address!'],
		trim:true
	},*/
	reg_date: {
		type: Date,
		default: Date.now
	},
	mod_date: {
		type: Date,
		default: null
	},
	refreshToken : {
		type: String
	}
}, {
	// __v 제거 (versionKey)
	versionKey: false // You should be aware of the outcome after set to false
});

// Statics model methods
// 1. find one user by using user_id
userSchema.statics.findOneByUserId = function(user_id) {
	return this.findOne({
		user_id
	}).exec()
};

/*
// 2. verify the password of the User documment
userSchema.methods.verify = function(user_password) {
	return this.user_password === user_password
};
*/

// query middleware
userSchema.pre('findOne', function() {
	//console.log(this instanceof mongoose.Query); // true
	const utility = require('../commons/utility');
	const currentTime = utility.getCurrentTime('YYYY-MM-DD HH:mm:ss');
	console.log('쿼리시작시간 : ' + currentTime);

	this.start = Date.now(); // 쿼리시작시간
});

userSchema.post('findOne', function(result) {
	//console.log(this instanceof mongoose.Query); // true

	// prints returned documents
	//console.log('findOne() returned ' + JSON.stringify(result)); // 데이터 조회 결과 데이터

	// prints number of milliseconds the query took
	//console.log('쿼리소요시간 : findOne() took ' + (Date.now() - this.start) + ' millis');

	const operTime = (Date.now() - this.start) / 1000; // sec
	console.log('쿼리소요시간 : findOne() took ' + operTime.toFixed(2) + ' sec');
});

// Create Model & Export
module.exports = mongoose.model('tbl_users', userSchema); //collection name : tbl_users