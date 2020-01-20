/**
 * 비밀번호 암호화 및 비교
 */

// DEPENDENCIES
const bc = require('bcryptjs'); // npm install bcryptjs

/**
 * 원문 해싱
 * 
 * @param raw 원문
 * @param callback
 */
exports.hash = (raw, callback) => {
	bc.genSalt(get_round_count(), (err, salt) => {
		if(err)
			return callback(err);

		bc.hash(raw, salt, (err, hash) => {
			if(err)
				return callback(err);

			return callback(undefined, hash);
		});
	});
};

/**
 * 원문과 해싱된 문자열 비교
 * 
 * @param raw 원문
 * @param hash 해싱된 문자열
 * @param callback
 */
exports.compare = (raw, hash, callback) => {
	bc.compare(raw, hash, (err, result) => {
		if(err)
			return callback(err);

		return callback(undefined, result);
	});
};

/**
 * 랜덤숫자 생성 (범위 1~10)
 * 
 * @returns 1~10 숫자
 */
function get_round_count() {
	return Math.floor((Math.random() * 10)) + 1;
}