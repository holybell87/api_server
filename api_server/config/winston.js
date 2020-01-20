/**
 * mongoDB 로그 설정
 *   - 콘솔에는 별도 출력하지 않고 파일 저장만 하도록..
 * 
 * https://www.npmjs.com/package/winston-daily-rotate-file
 */
const { createLogger, format, transports } = require("winston"); // npm install --save winston
require("winston-daily-rotate-file"); // npm install --save winston-daily-rotate-file
//const fs = require("fs"); // npm i fs
const settings = require('./settings');
const utility = require('../commons/utility');

const env = process.env.NODE_ENV || "development";
const logDir = settings.mongo_log_save_path;

// 폴더 생성
utility.makeDirectory(logDir);

function _customFormatter(info) {
	return '['+ info.timestamp + '] ' + 
		   '['+ info.level.toUpperCase() + '] ' +
		   '['+ info.message + ']';
}

const dailyRotateFileTransport = new transports.DailyRotateFile({
	level: "debug", // 로그 레벨 지정
	filename: `${logDir}/api_mongo-query.log_%DATE%`, // 파일 이름 (아래 설정한 날짜 형식이 %DATE% 위치에 들어간다)
	datePattern: "YYYY-MM-DD", // 날짜 형식 (대문자여야 적용된다.)
	zippedArchive: true, // 압축여부
	maxSize: "10m", // 로그 파일 하나의 용량 제한 (k(KB), m(MB), g(GB))
	maxFiles: "7d", // 로그 파일 개수 제한 (파일 또는 일수 설정. 일수를 사용할 경우 접미사로 'd'를 추가하여야 한다.)
	//prepend: true,
	//colorize: true,
	//json:false, //Setting JSON as false

	/*format: format.printf(
		info => `[${info.timestamp}] [${info.level.toUpperCase()}] [${info.message}]`
	)*/
	format: format.printf(
		info => `${_customFormatter(info)}`
	)

	//에러발생
	/*format: require("winston").format.printf(
		info => `${new Date().toFormat('YYYY-MM-DD HH24:MI:SS')} [${info.level.toUpperCase()}] - ${info.message}`
	)*/
});

const dailyRotateFileException = new transports.DailyRotateFile({
	level: "error", // 로그 레벨 지정
	filename: `${logDir}/api_mongo-exception.log_%DATE%`, // 파일 이름 (아래 설정한 날짜 형식이 %DATE% 위치에 들어간다)
	datePattern: "YYYY-MM-DD", // 날짜 형식 (대문자여야 적용된다.)
	zippedArchive: true, // 압축여부
	maxSize: "10m", // 로그 파일 하나의 용량 제한 (k(KB), m(MB), g(GB))
	maxFiles: "14d", // 로그 파일 개수 제한 (파일 또는 일수 설정. 일수를 사용할 경우 접미사로 'd'를 추가하여야 한다.)
	/*format: format.printf(
		info => `[${info.timestamp}] [${info.level.toUpperCase()}] [${info.message}]`
	)*/
	format: format.printf(
		info => `${_customFormatter(info)}`
	)
});

const logger = createLogger({
	level: env === "development" ? "debug" : "info",
	format: format.combine(
		format.timestamp({
			format: "YYYY-MM-DD HH:mm:ss"
		}),
		format.json()
	),
	transports: [
		// 콘솔 출력
		/*new transports.Console({
			level: "info",
			format: format.combine(
				format.colorize(),
				format.printf(
					//info => `${info.timestamp} ${info.level}: ${info.message}`
					info => `${info.timestamp} [${info.level.toUpperCase()}] - ${info.message}`
				)
			)
		}),*/
		// 파일 저장
		dailyRotateFileTransport
	],

	// uncaughtException 발생시 처리
	exceptionHandlers: [
		// 콘솔 출력
		/*new transports.Console({
			level: "error",
			format: format.combine(
				format.colorize(),
				format.printf(
					//info => `${info.timestamp} ${info.level}: ${info.message}`
					info => `${info.timestamp} [${info.level.toUpperCase()}] - ${info.message}`
				)
			)
		}),*/
		// 파일 저장
		dailyRotateFileException
	]
})

module.exports = logger;