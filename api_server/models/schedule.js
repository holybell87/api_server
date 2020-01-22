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
const mongoose = require("mongoose");

// Define Schemes
const Schema = mongoose.Schema;
const scheduleLogsSchema = new Schema(
  {
    exec_date: {
      type: Date,
      default: Date.now
    },
    set_dayOfWeek: String,
    set_hour: Number,
    set_min: Number,
    name: String,
    desc: String
  },
  {
    // __v 제거 (versionKey)
    versionKey: false // You should be aware of the outcome after set to false
  }
);

// Create Model & Export
module.exports = mongoose.model("tbl_schedule_logs", scheduleLogsSchema); //collection name : tbl_schedule_log
