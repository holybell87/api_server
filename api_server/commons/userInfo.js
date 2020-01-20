/**
 * 사용자 정보 set/get
 * 
 * (현재 사용하지 않음)
 */

// DEPENDENCIES
const ip_addr = require('../commons/ip_address');

let userId = '';
let userName = '';
let userIp = '';

/**
 * 1. 사용자 정보 SET
 * 
 * @param request
 * @param user 사용자 정보
 */
exports.setUserInfo = function(req, user) {
	userId = user.user_id;
	userName = user.user_name;
	userIp = ip_addr.getClientIpAddress(req);
};

/**
 * 2. 사용자 정보 GET
 * 
 * @param request
 */
exports.getUserInfo = function(req) {
	const userInfo = {
		userInfo : {
			userId: userId,
			userName: userName,
			userIp: userIp
		}
	};

	return userInfo;
};