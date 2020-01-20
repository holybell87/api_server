/**
 * 라우터에서 주어진 요청을 설정하기전에, JWT 검증 미들웨어를 통하여 JWT 검증 작업을 하고 나서, 주어진 작업을 하게 하도록 구현
 */

// DEPENDENCIES
const errs = require('../commons/errs');
const jwt = require('jsonwebtoken');
const log4 = require('../config/log4');
const res_builder = require('../commons/response_builder');
//const userInfo = require('../commons/userInfo');

const logger = log4.getLogger('authMiddleware');

const settings = require('../config/settings');
const jwt_key_access = settings.jwt_key_access;

const authMiddleware = (req, res, next) => {
	//logger.info(userInfo.getUserInfo(req)); // { userInfo: { userId: 'dhkang', userName: '강동혁', userIp: '127.0.0.1' } }

	// read the token from header or url 
	const token = req.headers['x-access-token'] || req.query.token;
/*
	// token does not exist
	if(!token) {
		return res.status(403).json({
			success: false,
			message: 'No token provided'
		});
	}
*/
	// create a promise that decodes the token
	const p = new Promise((resolve, reject) => {
		// token does not exist
		if(!token) {
			return reject(errs.merge_detail(
				errs.ERR_TOKEN_NOT_FIND,
				'No token provided'
			));
		}

		// access token 체크
		jwt.verify(token, jwt_key_access, (err, decoded) => {
			//if(err) reject(err);
			if(err) {
				if(err.message === 'jwt expired') {
					//console.log('accessToken 만료!');

					reject(errs.merge_detail(
						errs.ERR_JWT_VERIFY_FAIL,
						err.message
					));
				} else {
					// 에러로그 DB저장
					log4.saveError(req, res, errs.merge_detail(
						errs.ERR_JWT_VERIFY_FAIL,
						err.message
					));

					reject(errs.merge_detail(
						errs.ERR_JWT_VERIFY_FAIL,
						err.message
					));
				}
			}

			/*
			{ _id: '5ceb99e2f17ed72e5c8052c9',
			user_id: 'sysadmin',
			iat: 1559199994,
			exp: 1559203594 }
			*/
			//console.log(decoded);

			resolve(decoded);
		});
	});

	// if it has failed to verify, it will return an error message
	const onError = (error) => {
		/*res.status(403).json({
			success: false,
			message: error.message
		});*/
		res.status(403).json(
			res_builder.error( error )
		);
	};

	// process the promise
	p.then((decoded) => {
		req.decoded = decoded;
		next();
	}).catch(onError);
}

module.exports = authMiddleware;