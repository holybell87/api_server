/**
 * log4js 설정

	<Pattern format>
	- https://log4js-node.github.io/log4js-node/layouts.html
	- Fields can be any of:
		%r				time in toLocaleTimeString format
		%p				log level
		%c				log category
		%h				hostname
		%m				log data
		%d				date, formatted - default is ISO8601, format options are: ISO8601, ISO8601_WITH_TZ_OFFSET, ABSOLUTE, DATE, or any string compatible with the date-format library.
						e.g. %d{DATE}, %d{yyyy/MM/dd-hh.mm.ss}
		%%				% - for when you want a literal % in your output
		%n				newline
		%z				process id (from process.pid)
		%x{<tokenname>}	add dynamic tokens to your log. Tokens are specified in the tokens parameter.
		%X{<tokenname>}	add values from the Logger context. Tokens are keys into the context values.
		%[				start a coloured block (colour will be taken from the log level, similar to colouredLayout)
		%]				end a coloured block
 */

// DEPENDENCIES
const errs = require('../commons/errs');
const fs = require("fs"); // npm i fs
const ip_addr = require('../commons/ip_address');
const log4js = require("log4js"); // npm install log4js
const settings = require('./settings');
const _ = require('lodash'); // npm i --save lodash

// DEFINE MODEL
const modelErrLog = require('../models/errLog');

const logDir = settings.api_log_save_path;

// Create the log directory if it does not exist
if(!fs.existsSync(logDir)) {
	fs.mkdirSync(logDir)
}

/**
 * 1. 로그 출력 / 파일 생성
 * 
 * @param category category명 (보통 파일명으로 설정)
 * @returns data Npm버전
 */
exports.getLogger = function(category) {
	log4js.configure({
		appenders: {
			log_file: {
				type: 'dateFile',
				filename: logDir + '/api_server_console.log',
				pattern:"_yyyy-MM-dd",
//				maxLogSize: 10240,	// 10KB
				//maxLogSize: 1024000,	// 1MB (1024*1000*1)
//				numBackups: 3,

				// 매 시간마다 로그파일 압축
				//pattern:"_yyyy-MM-dd-hh",
				compress: true,

				layout: {
					type: "pattern",
					pattern: '[%d{yyyy-MM-dd hh:mm:ss}] [%p] [%c] (%x{pid}) %m',
					tokens: {
						pid : function() { return process.pid; }
						//user: function(logEvent) {
						//	return AuthLibrary.currentUser();
						//}
					}
				}
			},
			//out: { type: 'stdout' },
			log_console: {
				type: 'console',
				layout: {
					type: "pattern",
					//pattern: "%[%r (%x{pid}) %p %c -%] %m%n",
					pattern: '[%d{yyyy-MM-dd hh:mm:ss}] [%p] [%c] (%x{pid}) %m',
					tokens: {
						pid : function() { return process.pid; }
					}
				}
			},
			errorFile: {
				type: 'dateFile',
				filename: logDir + '/api_server_error.log',
				pattern:"_yyyy-MM-dd",
//				maxLogSize: 10240,	// 10KB
				//maxLogSize: 1024000,	// 1MB (1024*1000*1)
//				numBackups: 3,

				compress: true,

				layout: {
					type: "pattern",
					pattern: '[%d{yyyy-MM-dd hh:mm:ss}] [%p] [%c] (%x{pid}) %m',
					tokens: {
						pid : function() { return process.pid; }
					}
				}
			},
			log_errors: {
				type: 'logLevelFilter',
				level: 'ERROR',
				appender: 'errorFile'
			}
		},
		categories: {
			file: { appenders: [ 'log_file', 'log_errors' ], level: 'DEBUG' },
			//another: { appenders: ['log_console'], level: 'TRACE' },
			default: { appenders: [ 'log_console', 'log_file', 'log_errors' ], level: 'DEBUG' }
		}
	});

	//const logger = log4js.getLogger("app");
	const logger = log4js.getLogger(category);
	//logger.setLevel("DEBUG");
	//app.use(log4js.connectLogger(log4js.getLogger("app"), { level: 'auto' }));
	return logger;
};


/*
//exports.a = 10;
exports.getLogger = function() {
	// log4js 설정
	let log4js = require("log4js"); // npm install log4js

	log4js.configure({
		appenders: [
			{
				type: "console",
//				layout: {
//					type: "pattern",
//					pattern: "%[%r (%x{pid}) %p %c -%] %m%n",
//					tokens: {
//						pid : function() { return process.pid; }
//					}
//				}
			},
			{
				type: "file",
				filename: "../logs/logFile.log",
				category: "app",
				//maxLogSize: 20480,	// 20KB
				maxLogSize: 1024000,	// 1MB (1024*1000*1)
				backups: 3,
			},
			{
				type: "dateFile",
				filename: "../logs/logFileDate.log",
				pattern:"_yyyy-MM-dd",
				category: "app",
				layout: {
					type: "messagePassThrough"
				}
			}
		],
		replaceConsole: true,
		level:'auto'
	});

	let logger = log4js.getLogger("app");
	//logger.setLevel("DEBUG");
	//app.use(log4js.connectLogger(log4js.getLogger("app"), { level: 'auto' }));
	return logger;
};
*/

/**
 * 2. 에러로그 DB에 저장
 * 
 * @param request
 * @param response
 * @param error 에러정보
 */
exports.saveError = function(req, res, error) {
	const logger = this.getLogger('log4');

	// 1. Mongo 저장 포맷 설정
	const logFormat = {
		date: new Date(),
		method: req.method,
		//url: req.url,
		url: req.originalUrl,
		code: error.code,
		msg: error.msg,
		msg_detail: error.detail,
		remote_addr: req.headers.host, // 서버 IP
		user_ip: ip_addr.getClientIpAddress(req), // 사용자 IP
		entered_data: {}
		//response_time: tokens['response-time'](req, res)
	};

	// 2. 불필요 데이터 제거
	delete req.headers.accessToken;
	delete req.headers.refreshToken;
	delete req.query.user_password;
	delete req.body.user_password;

	// 3. 입력데이터 병합
	_.assign(logFormat.entered_data, req.query, req.body);

	// 4. 에러로그 출력
	const errLog = new modelErrLog(logFormat);
	logger.error(errLog);
	//logger.error('[ Error ]\r\n%o', errLog);

	// 5. Mongo 저장
	const errSave = settings.save_error_log;

	if(errSave.toUpperCase() == 'Y') {
		// 토큰 만료 에러는 저장하지 않음
		if(error.detail != 'jwt expired') {
			// Document instance method
			errLog.save(function(err) { //insert는 _id가 있어도 같은 동작을 하지만 , save는 중복체크를하여 _id가 있으면 update
				if(err) {
					logger.error(errs.merge_detail(
						errs.ERR_DATABASE_FAILED_INSERT_MONGO,
						err.message
					));
				} else {
					//console.log('insert error log. (id: ' + errLog._id + ')');
				}
			});
		}
	}
};