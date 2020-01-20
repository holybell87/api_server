/**
 * 현재는 사용하지 않고 있지만
 * 필요시 사용할 수 있도록 미리 작성
 */

// DEPENDENCIES
const jwt = require('jsonwebtoken'); // npm install jsonwebtoken
const _ = require('lodash'); // npm i --save lodash
//const errs = require('./errs.js');

const settings = require('../config/settings');
const jwt_key_access = settings.jwt_key_access;
const token_expire_sec_access = settings.token_expire_sec_access;

/**
 * 헤더토큰 파싱
 *
 * @param req
 * @param res
 * @param next
 */
module.exports = (req, res, next) => {
	const token = req.headers.auth_token;

	if(!token) {
		res.status(404);
		return next('Expired Token');
	}

	jwt.verify(token, jwt_key_access, (err, decoded) => {
		if (err) {
			if (err.message === 'jwt expired') {
				get_extended_token(token, (err, extended_token) => {
					if(err)
						return next(err.message);

					return res.json(
						_.assign(
							{TOKEN: extended_token},
							'Expired Token'
						)
					);
				});
			} else {
				return next(err.message);
			}
		} else {
			//console.log('jwt.verify');
			//console.log(decoded);
			req.user = decoded;
			return next();
		}
	});
};

/**
 * 새 토큰 발급
 *
 * @param token
 * @param callback
 */
function get_extended_token(token, callback) {
	const expired_token = jwt.decode(token, {json: true});

	delete expired_token.iat;
	delete expired_token.exp;

	jwt.sign(
		expired_token, //paylod
		jwt_key_access, // secret
		{expiresIn: token_expire_sec_access}, // options
		(err, hashed_token) => { // [callback]
			if(err)
				return callback(err);

			callback(null, hashed_token);
		}
	);
}