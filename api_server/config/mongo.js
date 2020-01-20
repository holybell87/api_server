// DEPENDENCIES
const mongoose = require('mongoose'); // npm install mongoose --save
const settings = require('./settings');
const log4 = require('./log4');
const winstonLogger = require('./winston');

const logger = log4.getLogger('mongo');


// CONFIGURE mongoose
mongoose.Promise = global.Promise; // Node의 네이티브 Promise 사용

/**
 * 1. mongoDB Connection
 */
//module.exports = () => {
exports.start = function() {
	function connect() {
		// CONNECT TO MONGODB SERVER
		const mongoConn = mongoose.connection;

		mongoConn.once('open', function() {
			const mongoAdmin = new mongoose.mongo.Admin(mongoConn.db);

			mongoAdmin.buildInfo(function (err, info) {
				// CONNECTED TO MONGODB SERVER
				logger.info("Connected to mongoDB (v" + info.version + ") server (" + settings.mongo.uri + ")");
			});
		});

		mongoConn.on('error', function(err) {
			//console.error.bind(console, 'mongoose connection error.');
			logger.error('DB ERROR: '+ err);
		});

		//mongoose.connect('mongodb://10.62.130.52/test');
		//mongoose.connect(mongoDB_url, { useNewUrlParser: true });
		//mongoose.connect('아이디:비밀번호@주소:포트/admin', { dbName: '데이터베이스' }, function(err) {});
		mongoose.connect(settings.mongo.uri, settings.mongo.option);
		//mongoose.set('useCreateIndex', true); // model 에서 인덱스 속성들을 사용가능하게 설정

		// mongoDB log set
		mongoose.set('debug', function (coll, method, query, doc, options) {
			//console.log(JSON.stringify(doc, undefined, 2));

			const set = {
				coll: coll,
				method: method,
				//query: JSON.stringify(query),
				//doc: JSON.stringify(doc),
				//options: JSON.stringify(options || {})
				query: query,
				doc: doc,
				options: options || {}
			};

			//winstonLogger.info({ dbQuery: set });
			winstonLogger.info( JSON.stringify({ dbQuery: set }) );
			//winstonLogger.info( set );
		});
	}

	connect();

	// 연결이 해제(disconnect)될 시에 다시 connect 함수를 실행
	//mongoose.connection.on('disconnected', connect);
};

/**
 * 2. mongoDB Disconnection
 *
 * @param callback
 */
exports.close = function(callback) {
	logger.info("Disconnected to mongoDB server (" + settings.mongo.uri + ")");

	mongoose.disconnect(callback);
};