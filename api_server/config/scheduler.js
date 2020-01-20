/**
 * 스케줄러 설정
 */

// DEPENDENCIES
const errs = require('../commons/errs');
const fs = require('fs'); // npm install --save fs
const log4 = require('./log4');
const path = require('path');
const schedule = require('node-schedule'); //npm install node-schedule
const settings = require('./settings');
const utility = require('../commons/utility');

const logger = log4.getLogger('scheduler');

// DEFINE MODEL
const modelSchedule = require('../models/schedule');

// 스케줄 설정 변수
const scheduleLogSave = settings.save_schedule_log;
const execHour1 = settings.schedule1_exec_hour;
const execMinute1 = settings.schedule1_exec_min;
const execHour2 = settings.schedule2_exec_hour;
const execMinute2 = settings.schedule2_exec_min;
let job; // 파일 이동 Job
let job2; // 파일 압축, 삭제 Job

/**
 * 1. scheduler Start
 *
 * @param dirName 프로젝트 최상위 경로
 */
exports.start = function(dirName) {
	function exec(dirName) {
/*
		// 파일크기 조회
		let fileName = dirName+'/logs/test.log';
		let fileSize = utility.getFileSize(fileName);
		console.log('The Size of ' + fileName + ' are ' + utility.setComma(fileSize) + ' bytes');

		fileName = dirName+'/logs/test.gz';
		fileSize = utility.setComma(utility.getFileSize(fileName));
		console.log('The Size of ' + fileName + ' are ' + utility.setComma(fileSize) + ' bytes');
*/

		//utility.execUnixCmd('find /logs . -name "*2019-07*"');
/*
		// 특정시간에 한번 실행
		// 2017년 12월 16일 오후 19시 27분에 수행할 작업
		const date = new Date(2017, 11, 16, 19, 27, 0);

		// 2017-12-16T10:27:00.000Z (GMT 0 기준)
		console.log(date); 

		const j = schedule.scheduleJob(date, () => {
			console.log('no pain, no gain');
		});

		// 매시 15분에 반복실행
		//const rule = new schedule.RecurrenceRule();
		//rule.minute = 15;
*/

		// Recurrence Rule Scheduling 
		// 0 - Sunday ~ 6 - Saturday
		// 월요일부터 일요일까지 9시 30분에 실행될 스케줄링
		// 1번 스케줄 설정
		const rule = new schedule.RecurrenceRule();
		rule.dayOfWeek = [0, new schedule.Range(0, 6)];
		rule.hour = execHour1;
		rule.minute = execMinute1;

		//console.log(rule);
		
		logger.info("Started the scheduler. Running a task every " + rule.hour + ":" + rule.minute);

		job = schedule.scheduleJob(rule, () => {
			logger.info('Running a job at ' + utility.getCurrentTime('YYYY-MM-DD HH:mm:ss'));

			if(scheduleLogSave.toUpperCase() == 'Y') {
				// Create model instance (= document)
				let scheduleLog = new modelSchedule();
				scheduleLog.exec_date = utility.getCurrentTime('YYYY-MM-DD HH:mm:ss');
				scheduleLog.set_dayOfWeek = '월 ~ 일';
				scheduleLog.set_hour = rule.hour;
				scheduleLog.set_min = rule.minute;
				scheduleLog.name = 'moveLogs';
				scheduleLog.desc = '로그파일 이동';

				// Document instance method
				scheduleLog.save(function(err) { //insert는 _id가 있어도 같은 동작을 하지만 , save는 중복체크를하여 _id가 있으면 update
					if(err) {
						logger.error(errs.merge_detail(
							errs.ERR_DATABASE_FAILED_INSERT_MONGO,
							err.message
						));
					}
				});
			}

			// 로그파일 이동
			moveLogs(dirName);
		});

		// Recurrence Rule Scheduling 
		// 0 - Sunday ~ 6 - Saturday
		// 월요일부터 일요일까지 21시 30분에 실행될 스케줄링
		// 2번 스케줄 설정
		const rule2 = new schedule.RecurrenceRule();
		rule2.dayOfWeek = [0, new schedule.Range(0, 6)];
		rule2.hour = execHour2;
		rule2.minute = execMinute2;
		
		logger.info("Started the scheduler. Running a task every " + rule2.hour + ":" + rule2.minute);

		job2 = schedule.scheduleJob(rule2, () => {
			logger.info('Running a job2 at ' + utility.getCurrentTime('YYYY-MM-DD HH:mm:ss'));

			if(scheduleLogSave.toUpperCase() == 'Y') {
				// Create model instance (= document)
				let scheduleLog2 = new modelSchedule();
				scheduleLog2.exec_date = utility.getCurrentTime('YYYY-MM-DD HH:mm:ss');
				scheduleLog2.set_dayOfWeek = '월 ~ 일';
				scheduleLog2.set_hour = rule2.hour;
				scheduleLog2.set_min = rule2.minute;
				scheduleLog2.name = 'compressLogs';
				scheduleLog2.desc = '로그파일 압축';

				// Document instance method
				scheduleLog2.save(function(err) { //insert는 _id가 있어도 같은 동작을 하지만 , save는 중복체크를하여 _id가 있으면 update
					if(err) {
						logger.error(errs.merge_detail(
							errs.ERR_DATABASE_FAILED_INSERT_MONGO,
							err.message
						));
					}
				});
			}

			// 1. 날짜폴더에 있는 파일 중 gz파일이 아닌 파일들은 gz파일로 변환시킴 (지난달 ~ 이번달)
			compressLogs(dirName);

/*
			// Create model instance (= document)
			let scheduleLog3 = new modelSchedule();
			scheduleLog3.exec_date = utility.getCurrentTime('YYYY-MM-DD HH:mm:ss');
			scheduleLog3.set_dayOfWeek = '월 ~ 일';
			scheduleLog3.set_hour = rule2.hour;
			scheduleLog3.set_min = rule2.minute;
			scheduleLog3.name = 'moveLogs';
			scheduleLog3.desc = '로그파일 이동';

			// Document instance method
			scheduleLog3.save(function(err) { //insert는 _id가 있어도 같은 동작을 하지만 , save는 중복체크를하여 _id가 있으면 update
				if(err) {
					logger.error(errs.merge_detail(
						errs.ERR_DATABASE_FAILED_INSERT_MONGO,
						err.message
					));
				}
			});

			// 2. 로그파일 이동
			moveLogs(dirName);
*/
		});
	}

	exec(dirName);
};


/**
 * 2. scheduler Stop
 *
 * @param callback
 */
exports.stop = function(callback) {
	logger.info("Stopped the scheduler");
	
	// 작업 취소
	job.cancel(callback);
	job2.cancel(callback);
};


/* ===================================
	1. 로그파일 이동
==================================== */
/**
 * 로그파일 이동
 * 
 * @param dirName 프로젝트 최상위 경로
 */
function moveLogs(dirName) {
	// 이번달
	const thisMonth = utility.getCurrentMonth('YYYY-MM');
	//console.log('thisMonth:'+thisMonth); // 2019-07

	// 지난달
	const lastMonth = utility.getAddDate('month', -1, 'YYYY-MM');
	//console.log('lastMonth:'+lastMonth); // 2019-06

	// 1. Api 로그파일 이동 (지난달 ~ 이번달)
	moveApiLogs(dirName, thisMonth, lastMonth);

	// 2. Mongo 로그파일 이동 (지난달 ~ 이번달)
	moveMongoLogs(dirName, thisMonth, lastMonth);
}

/**
 * 파일 이동 처리
 * 
 * @param type 로그파일 구분값
 * @param files 파일
 * @param searchStr 로그파일 검출하기 위한 검색어
 * @param currentPath 이동대상 파일경로
 * @param newPath 이동될 파일경로
 */
function moveFiles(type, files, searchStr, currentPath, newPath) {
	files.forEach(function(filename){
		//console.log(filename);

		if(type == 'api') {
			// 이번달 *.gz 파일만 검색
			if(filename.match(searchStr) && filename.match('.gz')) {
				//console.log(filename);

				utility.moveFile(currentPath+'/'+filename, newPath+'/'+filename);
			}
		} else if(type == 'mongo') {
			const today = utility.getCurrentDate('YYYY-MM-DD');

			// 이번달 *.log 파일만 검색 (금일파일은 제외)
			if(filename.match(searchStr) && filename.match('.log') && !filename.match(today)) {
				//console.log(filename);

				utility.moveFile(currentPath+'/'+filename, newPath+'/'+filename);
			}
		}
	});
}

/**
 * Api 로그파일 이동
 * 
 * @param dirName 프로젝트 최상위 경로
 * @param thisMonth 이번달 (YYYY-MM)
 * @param lastMonth 지난달 (YYYY-MM)
 */
function moveApiLogs(dirName, thisMonth, lastMonth) {
	// Api 로그파일 경로
	const logApiDir = path.join(dirName, settings.api_log_save_path);

	const newPath = path.join(logApiDir, thisMonth);
	const lastPath = path.join(logApiDir, lastMonth);

	// 디렉토리 생성
	utility.makeDirectory(logApiDir);
	utility.makeDirectory(newPath);
	utility.makeDirectory(lastPath);

	fs.readdir(logApiDir, "utf8", function(err, files){
		if(err) {
			logger.error(err);
			//throw err;
		}

		moveFiles('api', files, thisMonth, logApiDir, newPath);
		moveFiles('api', files, lastMonth, logApiDir, lastPath);
	});
}

/**
 * Mongo 로그파일 이동
 * 
 * @param dirName 프로젝트 최상위 경로
 * @param thisMonth 이번달 (YYYY-MM)
 * @param lastMonth 지난달 (YYYY-MM)
 */
function moveMongoLogs(dirName, thisMonth, lastMonth) {
	// Mongo 로그파일 경로
	const logMongoDir = path.join(dirName, settings.mongo_log_save_path);

	const newPath = path.join(logMongoDir, thisMonth);
	const lastPath = path.join(logMongoDir, lastMonth);

	// 디렉토리 생성
	utility.makeDirectory(logMongoDir);
	utility.makeDirectory(newPath);
	utility.makeDirectory(lastPath);

	fs.readdir(logMongoDir, "utf8", function(err, files){
		if(err) {
			logger.error(err);
			//throw err;
		}

		moveFiles('mongo', files, thisMonth, logMongoDir, newPath);
		moveFiles('mongo', files, lastMonth, logMongoDir, lastPath);
	});
}


/* ===================================
	2. 로그파일 삭제
==================================== */
/**
 * 로그파일 삭제
 * 
 * @param dirName 프로젝트 최상위 경로
 */
function deleteLogs(dirName) {
	// 이번달
	const thisMonth = utility.getCurrentMonth('YYYY-MM');
	//console.log('thisMonth:'+thisMonth); // 2019-07

	// 지난달
	const lastMonth = utility.getAddDate('month', -1, 'YYYY-MM');
	//console.log('lastMonth:'+lastMonth); // 2019-06

	// 1. Api 로그파일 삭제 (지난달 ~ 이번달)
	deleteApiLogs(dirName, thisMonth, lastMonth);

	// 2. Mongo 로그파일 삭제 (지난달 ~ 이번달)
	deleteMongoLogs(dirName, thisMonth, lastMonth);
}

/**
 * Api 로그파일 삭제
 * 
 * @param dirName 프로젝트 최상위 경로
 * @param thisMonth 이번달 (YYYY-MM)
 * @param lastMonth 지난달 (YYYY-MM)
 */
function deleteApiLogs(dirName, thisMonth, lastMonth) {
	const logApiDir = path.join(dirName, settings.api_log_save_path);
	const fileName = 'text1.txt';

	utility.deleteFile(logApiDir + '/' + fileName);
	/*
	// 1. 파일유무 확인
	if(fs.existsSync(logApiDir + '/' + fileName)) {
		// 2. 파일삭제
		fs.unlink(logApiDir + '/' + fileName, function(err) {
			if(err) {
				logger.error(err);
				//throw err;
			}
	
			logger.info('Successfully deleted %s', fileName);
		})
	} else {
		console.log('Api 로그파일 삭제대상 없음');
	}
	*/
}

/**
 * Mongo 로그파일 삭제
 * 
 * @param dirName 프로젝트 최상위 경로
 * @param thisMonth 이번달 (YYYY-MM)
 * @param lastMonth 지난달 (YYYY-MM)
 */
function deleteMongoLogs(dirName, thisMonth, lastMonth) {
	const logMongoDir = path.join(dirName, settings.mongo_log_save_path);
	const fileName = 'text2.txt';

	utility.deleteFile(logMongoDir + '/' + fileName);
	/*
	// 1. 파일유무 확인
	if(fs.existsSync(logMongoDir + '/' + fileName)) {
		// 2. 파일삭제
		fs.unlink(logMongoDir + '/' + fileName, function(err) {
			if(err) {
				logger.error(err);
				//throw err;
			}

			logger.info('Successfully deleted %s', fileName);
		})
	} else {
		console.log('mongo 로그파일 삭제대상 없음');
	}
	*/
}


/* ===================================
	3. 로그파일 압축
==================================== */
/**
 * 로그파일 압축
 *   - 날짜폴더에 있는 파일 중 gz파일이 아닌 파일들은 gz파일로 변환시킴
 * 
 * @param dirName 프로젝트 최상위 경로
 */
function compressLogs(dirName) {
	// 이번달
	const thisMonth = utility.getCurrentMonth('YYYY-MM');
	//console.log('thisMonth:'+thisMonth); // 2019-07

	// 지난달
	const lastMonth = utility.getAddDate('month', -1, 'YYYY-MM');
	//console.log('lastMonth:'+lastMonth); // 2019-06

	// 1. Api 로그파일 gz파일로 변환 (지난달 ~ 이번달)
	compressApiLogs(dirName, thisMonth, lastMonth);

	// 2. Mongo 로그파일 gz파일로 변환 (지난달 ~ 이번달)
	compressMongoLogs(dirName, thisMonth, lastMonth);
}

/**
 * Api 로그파일 gz파일로 변환
 * 
 * @param dirName 프로젝트 최상위 경로
 * @param thisMonth 이번달 (YYYY-MM)
 * @param lastMonth 지난달 (YYYY-MM)
 */
function compressApiLogs(dirName, thisMonth, lastMonth) {
	// Api 로그파일 경로
	const logApiDir = path.join(dirName, settings.api_log_save_path);

	const newPath = path.join(logApiDir, thisMonth);
	const lastPath = path.join(logApiDir, lastMonth);

	fs.readdir(newPath, "utf8", function(err, files) {
		if(err) {
			logger.error(err);
			//throw err;
		}

		files.forEach(function(filename) {
			// gz파일이 아닌 파일만 변환
			//if(!filename.match('.gz')) {
			if(utility.getExtensionOfFilename(filename) != '.gz') {
				utility.convertGzFile(path.join(newPath, filename));
			}
		});
	});

	fs.readdir(lastPath, "utf8", function(err, files) {
		if(err) {
			logger.error(err);
			//throw err;
		}

		files.forEach(function(filename) {
			// gz파일이 아닌 파일만 변환
			//if(!filename.match('.gz')) {
			if(utility.getExtensionOfFilename(filename) != '.gz') {
				utility.convertGzFile(path.join(lastPath, filename));
			}
		});
	});
}

/**
 * Mongo 로그파일 gz파일로 변환
 * 
 * @param dirName 프로젝트 최상위 경로
 * @param thisMonth 이번달 (YYYY-MM)
 * @param lastMonth 지난달 (YYYY-MM)
 */
function compressMongoLogs(dirName, thisMonth, lastMonth) {
	// Mongo 로그파일 경로
	const logMongoDir = path.join(dirName, settings.mongo_log_save_path);

	const newPath = path.join(logMongoDir, thisMonth);
	const lastPath = path.join(logMongoDir, lastMonth);

	fs.readdir(newPath, "utf8", function(err, files) {
		if(err) {
			logger.error(err);
			//throw err;
		}

		files.forEach(function(filename) {
			// gz파일이 아닌 파일만 변환
			//if(!filename.match('.gz')) {
			if(utility.getExtensionOfFilename(filename) != '.gz') {
				utility.convertGzFile(path.join(newPath, filename));
			}
		});
	});

	fs.readdir(lastPath, "utf8", function(err, files) {
		if(err) {
			logger.error(err);
			//throw err;
		}

		files.forEach(function(filename) {
			// gz파일이 아닌 파일만 변환
			//if(!filename.match('.gz')) {
			if(utility.getExtensionOfFilename(filename) != '.gz') {
				utility.convertGzFile(path.join(lastPath, filename));
			}
		});
	});
}