/**
 * 환경설정
 */

module.exports = {
	// Server
	/*app_version: (() => {
		return 'v1';
	})(),*/

	/* ===================================
		Web Server
	==================================== */
	// web port
	port: (() => {
		return parseInt(process.env.SERVER_PORT) || 3001; // PORT값이 설정되어있지 않다면 3001번을 사용
	})(),

	/* ===================================
		Token
	==================================== */
	// JWT Secret Key
	jwt_key_access: (() => {
		return process.env.JWT_KEY_ACCESS;
	})(),
	jwt_key_refresh: (() => {
		return process.env.JWT_KEY_REFRESH;
	})(),

	// JWT Expire sec (토큰 만료 시간)
	token_expire_sec_access: (() => {
		//return 60 * 60 * 24;
		return process.env.TOKEN_EXPIRE_SEC_ACCESS;
	})(),
	token_expire_sec_refresh: (() => {
		//return 60 * 60 * 24;
		return process.env.TOKEN_EXPIRE_SEC_REFRESH;
	})(),

	/* ===================================
		File Upload
	==================================== */
	// 파일 업로드 경로
	file_upload_path: (() => {
		return process.env.FILE_UPLOAD_PATH;
	})(),

	// 한번에 업로드 가능한 파일 갯수
	file_upload_max_count: (() => {
		return parseInt(process.env.FILE_UPLOAD_MAX_COUNT);
	})(),

	// 업로드 가능한 파일 크기
	file_upload_max_size: (() => {
		return get_file_max_size();
	})(),

	// 업로드 허용 확장자
	file_upload_check_ext: (() => {
		return get_file_upload_check_ext();
	})(),


	/* ===================================
		File Upload
	==================================== */
	// 에러로그를 DB에 저장할지 여부
	save_error_log: (() => {
		return process.env.SAVE_ERROR_LOG;
	})(),


	/* ===================================
		Database - MongoDB
	==================================== */
	mongo: {
		uri: process.env.MONGO_URI,
		option: {
			user: process.env.MONGO_USER,
			pass: process.env.MONGO_PASSWORD,
			autoReconnect: true,
			connectTimeoutMS: 3000, // Defaults to 30000
			reconnectTries: 10, // reconnect 재시도 횟수
			reconnectInterval: 5000, // Reconnect every 5000ms
			useNewUrlParser: true,
			useCreateIndex: true // model에서 인덱스 속성들을 사용가능하게 설정
		}
	},

	/* ===================================
		로그 파일 저장 경로
	==================================== */
	// api 로그 저장 경로
	api_log_save_path: (() => {
		return process.env.API_LOG_SAVE_PATH;
	})(),
	// mongo 로그 저장 경로
	mongo_log_save_path: (() => {
		return process.env.MONGO_LOG_SAVE_PATH;
	})(),


	/* ===================================
		스케줄러 설정
	==================================== */
	// 에러로그를 DB에 저장할지 여부
	save_schedule_log: (() => {
		return process.env.SAVE_SCHEDULE_LOG;
	})(),
	// 스케줄 실행 hour(시)
	schedule1_exec_hour: (() => {
		return Number(process.env.SCHEDULE1_EXEC_HOUR);
	})(),
	// 스케줄 실행 Min(분)
	schedule1_exec_min: (() => {
		return Number(process.env.SCHEDULE1_EXEC_MIN);
	})(),
	// 스케줄 실행 hour(시)
	schedule2_exec_hour: (() => {
		return Number(process.env.SCHEDULE2_EXEC_HOUR);
	})(),
	// 스케줄 실행 Min(분)
	schedule2_exec_min: (() => {
		return Number(process.env.SCHEDULE2_EXEC_MIN);
	})(),

};

function get_file_max_size() {
	let maxFileSize = process.env.FILE_UPLOAD_MAX_SIZE;
	const tmp = maxFileSize.split("*");
	let num = 1;

	for(let i=0; i<tmp.length; i++) {
		num = num * tmp[i];
	}

	maxFileSize = parseInt(num);

	return maxFileSize;
}

function get_file_upload_check_ext() {
	const fileExt = process.env.FILE_UPLOAD_CHECK_EXT;
	const tmp = fileExt.split(",");
	let arrExt = new Array; 

	for(let i=0; i<tmp.length; i++) {
		arrExt.push(tmp[i].toLowerCase());
	}

	return arrExt;
}