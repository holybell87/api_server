/**
 * Client IP Address 가져오기
 * 
 * @param request
 * @returns ip 사용자IP주소
 */
exports.getClientIpAddress = function(req) {
	let ip = req.headers['x-forwarded-for'] || 
			 req.connection.remoteAddress || 
			 req.socket.remoteAddress ||
			 (req.connection.socket ? req.connection.socket.remoteAddress : null);

	if(ip.length < 15) {
		ip = ip;
	} else {
		ip = ip.slice(7);
	}

	return ip;
};