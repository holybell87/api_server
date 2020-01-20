/**
 * 파라메터 유효성 검증
 */
const _ = require('lodash');
const errs = require('./errs');
//const Promise = require('bluebird');

/**
 * 파라미터 확인 정규식
 *
 */
const expressions = {

	// tbl_users
	user_id: /^[a-zA-Z0-9]{4,20}$/i,
	user_name: /^[가-힣a-zA-Z0-9]{1,20}$/i,
	user_password: /^[a-z0-9]{1,64}$/i,
	authority: /^(admin|normal)$/,

/*
	// 특수문자 체크
	user_id: /[`~!@#$%^&*|\\\'\";:\/?]/gi,

	// 이메일 형식 체크
	user_email: /^[A-Za-z0-9_\.\-]+@[A-Za-z0-9\-]+\.[A-Za-z0-9\-]+/,

	// 핸드폰 번호 형식 체크
	user_mobile: /(01[016789])([1-9]{1}[0-9]{2,3})([0-9]{4})$/,

	// 일반 전화번호 형식 체크
	user_phone1: /(02)([0-9]{3,4})([0-9]{4})$/,
	user_phone2: /(0[3-9]{1}[0-9]{1})([0-9]{3,4})([0-9]{4})$/,
*/
};

/**
 * Promise
 *
 * @param obj
 * @param keys
 */
exports.by_promise = (obj, keys) => {
	return new Promise((resolve, reject) => {
		module.exports.paramCheck(obj, keys, (err) => {
			if(err) {
				return reject(err);
			} else {
				return resolve();
			}
		});
	});
};

/**
 * 파라미터 검사
 *
 * @param obj
 * @param keys
 * @param callback
 * @returns {*}
 */
exports.paramCheck = (obj, keys, callback) => {
	// 차집합
	// _.difference(array, *others)
	// _.difference([1, 2, 3, 4, 5], [5, 2, 10]);
	//   => [1, 3, 4]

	const params = _.keys(obj),
		difference = _.difference(keys, params);

	if(difference.length > 0) {
		return callback(errs.merge_detail(
			errs.ERR_NO_REQUIRED_PARAMTERS,
			difference.join(', ')
		));
	}

	for(let i in keys) {
		const key = keys[i],
			val = obj[key];

		if(Array.isArray(val)) {
			for(let j in val) {
				validate_value(key, val[j], callback);
			}
		} else {
			validate_value(key, val, callback);
		}
	}

	callback();
};

function validate_value(key, value, callback) {
	if(!expressions[key].test(value)) {
		return callback(errs.merge_detail(
			errs.ERR_UNMATCHED_PARAMETERS, key
		));
	}
}
