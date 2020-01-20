/**
 * ERROR 코드, 메시지 정의
 */

module.exports = {
	/* ===================================
		1-20. 회원가입
	==================================== */
	ERR_INVALID_USER_INFORM: {
		code: 1,
		msg: 'Invalid user inform'
	},
	ERR_DUPLICATE_USER: {
		code: 2,
		msg: 'User already exist'
	},

	/* ===================================
		21-40. 회원정보 찾기
	==================================== */
	ERR_USER_NOT_EXIST: {
		code: 21,
		msg: 'User does not exist'
	},

	/* ===================================
		41-50. 로그인
	==================================== */
	ERR_INVALID_USERNAME_OR_PASSWORD: {
		code: 41,
		msg: 'Invalid username or password'
	},
	ERR_FAILED_TO_CREATE_ACCESS_TOKEN: {
		code: 42,
		msg: 'Failed to create access token'
	},
	ERR_FAILED_TO_CREATE_REFRESH_TOKEN: {
		code: 43,
		msg: 'Failed to create refresh token'
	},
	ERR_EXPIRED_TOKEN: {
		code: 44,
		msg: 'Expired token'
	},
	ERR_INVALID_TOKEN: {
		code: 45,
		msg: 'Invalid token'
	},
	ERR_AVAILABLE_TOKEN: {
		code: 46,
		msg: 'Available token'
	},
	ERR_TOKEN_NOT_FIND: {
		code: 47,
		msg: 'Token can not find'
	},
	ERR_JWT_VERIFY_FAIL: {
		code: 48,
		//msg: 'JWT Verify Error'
		msg: 'Unauthorized access'
	},

	/* ===================================
		51-69. 공통
	==================================== */
	// Validation
	ERR_NO_REQUIRED_PARAMTERS: {
		code: 51,
		msg: 'No required parameters'
	},
	ERR_UNMATCHED_PARAMETERS: {
		code: 52,
		msg: 'Unmatched paramters'
	},
	ERR_INVALID_REQUEST: {
		code: 53,
		msg: 'Invalid request'
	},
	ERR_PARAMETER_LENGTH_TOO_LONG: {
		code: 54,
		msg: 'Parameter length too long'
	},
	ERR_FILE_UPLOAD: {
		code: 55,
		msg: 'Failed to upload file'
	},
	ERR_FILE_NOT_EXIST: {
		code: 56,
		msg: 'File does not exist'
	},

	/* ===================================
		71-99. 시스템
	==================================== */
	// Database
	ERR_REDIS_ERROR: {
		code: 71,
		msg: 'Redis Error'
	},
	ERR_DATABASE_FAILED_SELECT: {
		code: 72,
		msg: 'Failed to select'
	},
	ERR_DATABASE_FAILED_UPDATE: {
		code: 73,
		msg: 'Failed to update'
	},
	ERR_DATABASE_FAILED_INSERT: {
		code: 74,
		msg: 'Failed to insert data'
	},
	ERR_DATABASE_FAILED_DELETE: {
		code: 75,
		msg: 'Failed to delete data'
	},
	ERR_DATABASE_FAILED_SELECT_MONGO: {
		code: 76,
		msg: 'Failed to select data (MONGO)'
	},
	ERR_DATABASE_FAILED_UPDATE_MONGO: {
		code: 77,
		msg: 'Failed to update data (MONGO)'
	},
	ERR_DATABASE_FAILED_INSERT_MONGO: {
		code: 78,
		msg: 'Failed to insert data (MONGO)'
	},
	ERR_DATABASE_FAILED_DELETE_MONGO: {
		code: 79,
		msg: 'Failed to delete data (MONGO)'
	},
	ERR_TRANSACTION_OPEN: {
		code: 80,
		msg: 'Transaction open'
	},
	ERR_TRANSACTION_COMMIT: {
		code: 81,
		msg: 'Transaction commit'
	},

	// Password hashing
	ERR_PASSWORD_HASHING: {
		code: 82,
		msg: 'An error has occurred while hashing password'
	},
	ERR_PASSWORD_COMPARING: {
		code: 83,
		msg: 'An error has occurred while comparing password'
	},

	// Not found
	ERR_API_NOT_FOUND: {
		code: 99,
		msg: 'API Not Found'
	},

	/* ===================================
		객체 병합
	==================================== */
	merge_detail: (err, message) => {
		return Object.assign(
			{}, err, {detail: message}
		);
	}
};
