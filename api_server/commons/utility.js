// DEPENDENCIES
const fs = require('fs'); // npm install --save fs
const log4 = require('../config/log4');
const moment = require('moment'); //npm install moment --save
const nodeCmd = require('node-cmd'); // npm i node-cmd 

const logger = log4.getLogger('utility');


/**
 * 금액 형식으로 변환
 *   (ex) 10000 -> 10,000)
 * 
 * @param str 숫자값
 * @returns str 콤마추가된 문자열
 */
exports.setComma = function(str) {
	if(typeof(str) == 'number') { // 숫자형
		return String(str).replace(/(\d)(?=(?:\d{3})+(?!\d))/g, '$1,');
	} else if(typeof(str) == 'string') { // 문자형
		return str.replace(/(\d)(?=(?:\d{3})+(?!\d))/g, '$1,');
	} else {
		return str;
	}
};

/**
 * 현재 일자 조회
 * 
 * @param format 날짜포멧 (ex) 'YYYY-MM-DD')
 * @returns thisDay 현재 일자
 */
exports.getCurrentDate = function(format) {
	if(format.length >= 8 && format.length <= 10 ) {
		const thisDay = moment(new Date()).format(format);
		return thisDay;
	} else {
		console.log('[getCurrentDate] format 형식이 올바르지 않습니다.');
		return '';
	}
};

/**
 * 현재 시간 조회
 * 
 * @param format 날짜포멧 (ex) 'YYYY-MM-DD HH:mm:ss')
 * @returns thisTime 현재 시간
 */
exports.getCurrentTime = function(format) {
	if(format.length >= 14 && format.length <= 19 ) {
		const thisTime = moment(new Date()).format(format);
		return thisTime;
	} else {
		console.log('[getCurrentTime] format 형식이 올바르지 않습니다.');
		return '';
	}
};

/**
 * 현재 월 조회
 * 
 * @param format 날짜포멧 (ex) 'YYYY-MM')
 * @returns thisMonth 현재 월
 */
exports.getCurrentMonth = function(format) {
	if(format.length >= 6 && format.length <= 7 ) {
		const thisMonth = moment(new Date()).format(format);
		return thisMonth;
	} else {
		console.log('[getCurrentMonth] format 형식이 올바르지 않습니다.');
		return '';
	}
};

/**
 * +/- 일/월 조회
 * 
 * @param type 일/월 구분값
 * @param num +/- 일수/개월
 * @param format 날짜포멧 (ex) 'YYYY-MM-DD')
 * @returns str +/-된 일자
 */
exports.getAddDate = function(type, num, format) {
	let str;

	if(type == 'day') {
		// 하루전
		//const yesterday = moment(new Date()).add(-1, 'days').format('YYYY-MM-DD');

		if(format.length >= 8 && format.length <= 10 ) {
			const yesterday = moment(new Date()).add(num, 'days').format(format);
			str = yesterday;
		} else {
			console.log('[getAddDate] format 형식이 올바르지 않습니다.');
			str = '';
		}
	} else if(type == 'month') {
		// 지난달
		//const lastMonth = moment(new Date()).add(-1, 'months').format('YYYY-MM');

		if(format.length >= 6 && format.length <= 7 ) {
			const lastMonth = moment(new Date()).add(num, 'months').format(format);
			str = lastMonth;
		} else {
			console.log('[getAddDate] format 형식이 올바르지 않습니다.');
			str = '';
		}
	} else {
		console.log('[getAddDate] type이 올바르지 않습니다.');
		str = '';
	}

	//console.log('[getAddDate] str : ' + str);
	return str;
};

/**
 * 첫째날 조회
 * 
 * @param year 년도 (YYYY)
 * @param month 월 (MM)
 * @param format 날짜포멧 (ex) 'YYYY-MM-DD')
 * @returns firstDate 첫째날 (1일)
 */
exports.getFirstDate = function(year, month, format) {
	if(format.length >= 8 && format.length <= 10 ) {
		const firstDate = moment(new Date(year, month-1, 1)).format(format); // 2019-07-01
		return firstDate;
	} else {
		console.log('[getFirstDate] format 형식이 올바르지 않습니다.');
		return '';
	}
};

/**
 * 마지막날 조회
 * 
 * @param year 년도 (YYYY)
 * @param month 월 (MM)
 * @param format 날짜포멧 (ex) 'YYYY-MM-DD')
 * @returns lastDate 마지막날 (28/29/30/31일)
 */
exports.getLastDate = function(year, month, format) {
	//var now = new Date();
	//const lastDate = moment(new Date(now.getFullYear(), now.getMonth()+1, 0)).format('YYYY-MM-DD');

	if(format.length >= 8 && format.length <= 10 ) {
		const lastDate = moment(new Date(year, month, 0)).format(format); // 2019-07-31
		return lastDate;
	} else {
		console.log('[getLastDate] format 형식이 올바르지 않습니다.');
		return '';
	}
};

/**
 * 파일크기 조회
 * 
 * @param fileName 파일명
 * @returns fileSizeInBytes 파일크기 (단위: 바이트)
 */
exports.getFileSize = function(fileName) {
	if(fs.existsSync(fileName)) {
		const stats = fs.statSync(fileName);
		const fileSizeInBytes = stats.size;

		//Convert the file size to megabytes (optional)
		//const fileSizeInMegabytes = fileSizeInBytes / 1000000.0;
		//console.log('fileSizeInMegabytes : '+fileSizeInMegabytes + ' MB');

		return fileSizeInBytes;
	} else {
		console.log(fileName + ' 파일이 존재하지 않습니다.');
		return null;
	}
};

/**
 * 디렉토리 생성
 * 
 * @param path 생성할 디렉토리 경로 + 디렉토리명
 */
exports.makeDirectory = function(path) {
	// Create the directory if it does not exist
	if(!fs.existsSync(path)) {
		logger.info('[makeDirectory] Successfully created the directory : %s', path);
		fs.mkdirSync(path)
	}
};

/**
 * 파일 이동
 * 
 * @param oldPath 이동대상 파일경로
 * @param newPath 이동될 파일경로
 */
exports.moveFile = function(oldPath, newPath) {
	// 1. 파일유무 확인
	if(fs.existsSync(oldPath)) {
		// 2. 파일이동
		fs.rename(oldPath, newPath, function(err){
			if(err) {
				logger.error(err);
				//throw err;
			} else {
				logger.info('[moveFile] rename complete : ' + oldPath + ' → ' + newPath);
			}
		})
	} else {
		console.log(oldPath + ' 파일이 존재하지 않습니다.');
	}
};

/**
 * 파일 삭제
 * 
 * @param fileName 파일명
 */
exports.deleteFile = function(fileName) {
	// 1. 파일유무 확인
	if(fs.existsSync(fileName)) {
		// 2. 파일삭제
		fs.unlink(fileName, function(err) {
			if(err) {
				logger.error(err);
				//throw err;
			} else {
				logger.info('[deleteFile] Successfully deleted : %s', fileName);
			}
		})
	} else {
		console.log(fileName + ' 파일이 존재하지 않습니다.');
	}
};

/**
 * gz파일로 변환
 * 
 * @param fileName 파일명
 */
exports.convertGzFile = function(fileName) {
	if(fs.existsSync(fileName)) {
		const zlib = require('zlib');
		const gzip = zlib.createGzip();

		// 압축대상 파일
		const inp = fs.createReadStream(fileName);

		// 압축결과 파일
		const out = fs.createWriteStream(fileName+'.gz');

		// 1. 파일 변환
		inp.pipe(gzip).pipe(out);

		logger.info('[convertGzFile] convert complete : ' + fileName + ' → ' + fileName + '.gz');

		// 2. 파일 변환 후 변환 이전 파일은 삭제
		this.deleteFile(fileName);
	} else {
		console.log(fileName + ' 파일이 존재하지 않습니다.');
	}
};

/**
 * 파일명에서 확장자 추출
 * 
 * @param fileName 파일명
 * @returns _fileExt 확장자명
 */
exports.getExtensionOfFilename = function(fileName) {
	const _fileLen = fileName.length;

	/** 
	 * lastIndexOf('.') 
	 * 뒤에서부터 '.'의 위치를 찾기위한 함수
	 * 검색 문자의 위치를 반환한다.
	 * 파일 이름에 '.'이 포함되는 경우가 있기 때문에 lastIndexOf() 사용
	 */
	const _lastDot = fileName.lastIndexOf('.');

	// 확장자 명만 추출한 후 소문자로 변경
	const _fileExt = fileName.substring(_lastDot, _fileLen).toLowerCase();
	//console.log('[getExtensionOfFilename] ' + fileName + '의 확장자는 (' + _fileExt + ') 입니다.');

	return _fileExt;
};

/**
 * Node Version 조회
 * 
 * @returns data Node버전
 */
exports.getNodeVersion = function() {
	const cmd = 'node -v';

	return new Promise(function (resolve, reject) {
		nodeCmd.get(
			cmd,
			function(err, data, stderr){
				if(!err) {
					//logger.info('node version is '+ data.trim());
					return resolve(data.trim());
				} else {
					logger.error(err);
					return reject();
				}
			}
		);
	});
};

/**
 * Npm Version 조회
 * 
 * @returns data Npm버전
 */
exports.getNpmVersion = function() {
	const cmd = 'npm -v';

	return new Promise(function (resolve, reject) {
		nodeCmd.get( 
			cmd,
			function(err, data, stderr){
				if(!err) {
					//logger.info('npm version is '+ data.trim());
					return resolve(data.trim());
				} else {
					logger.error(err);
					return reject();
				}
			}
		);
	});
};

/**
 * UNIX 명령어 실행
 * 
 * @param cmd 명령어
 */
exports.execUnixCmd = function(cmd) {
	const os = require('os');
	// console.log("** os.tmpdir = " + os.tmpdir());
	// console.log("** os.endianness = " + os.endianness());
	// console.log("** os.hostname = " + os.hostname());
	// console.log("** os.type = " + os.type());
	// console.log("** os.platform = " + os.platform());
	// console.log("** os.arch = " + os.arch());
	// console.log("** os.release = " + os.release());
	// console.log("** os.uptime = " + os.uptime());
	// console.log("** os.loadavg = " + os.loadavg());
	// console.log("** os.totalmem = " + os.totalmem());
	// console.log("** os.freemem = " + os.freemem());
	// console.log("** os.cpus = " + JSON.stringify(os.cpus(),null,2));
	// console.log("** os.networkInterfaces = " + JSON.stringify(os.networkInterfaces(),null,2));
	// console.log("** os.EOL = " + os.EOL);

	// 윈도우인 경우 유닉스 명령어 실행하지 않도록
	if(!os.platform().match('win')) {
		// case 1. command
		//nodeCmd.run('touch example.created.file');

		// case 2. command,callback
		nodeCmd.get(
			cmd,
			/*`
				git clone https://github.com/RIAEvangelist/node-cmd.git
				cd node-cmd
				ls
			`,*/
			function(err, data, stderr){
				if(!err) {
					logger.info('cmd result : ['+ data.trim() + ']');
				} else {
					logger.error(err);
				}
			}
		);
	} else {
		console.log('windows에서는 실행할 수 없습니다.');
	}
};
