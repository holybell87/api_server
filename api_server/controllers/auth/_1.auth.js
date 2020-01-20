/*
----------------------------------------------------------------------
[ROUTE]							[METHOD]	[DESCRIPTION]
----------------------------------------------------------------------
/api/auth/register				POST		신규 사용자를 등록한다.
/api/auth/update/:user_id		PUT			사용자 정보를 수정한다.
/api/auth/delete/:user_id		DELETE		사용자를 삭제한다.
/api/auth/login					POST		로그인을 시도한다.
/api/auth/requestToken			GET			새 토큰을 발급한다.
----------------------------------------------------------------------
*/

// DEPENDENCIES
const errs = require('../../commons/errs');
const jwt = require('jsonwebtoken');
const log4 = require('../../config/log4');
const password = require('../../commons/password');
const res_builder = require('../../commons/response_builder');
const settings = require('../../config/settings');
const userInfo = require('../../commons/userInfo');
const _ = require('lodash'); // npm i --save lodash

const validate = require('../../commons/validation');

// DEFINE MODEL
const modelUser = require('../../models/user');

//require('date-utils'); // npm install date-utils

const logger = log4.getLogger('_1.auth');
const jwt_key_access = settings.jwt_key_access;
const jwt_key_refresh = settings.jwt_key_refresh;
const token_expire_sec_access = settings.token_expire_sec_access;
const token_expire_sec_refresh = settings.token_expire_sec_refresh;

/**
 * 1. 사용자 등록
 *  [POST] /api/auth/register
 *  - 기등록자 확인을 위한 사용자 조회
 *  - 비밀번호 암호화하여 사용자 insert
 *
 * @body user_id 사용자 ID
 * @body user_name 사용자명
 * @body user_password 사용자 비밀번호
 * @body authority 권한
 */
exports.register = (req, res) => {
	// 1. request data
	const { user_id, user_name, user_password, authority } = req.body;

	// 2-3. 비밀번호 암호화하여 사용자 insert
	const create = (user) => {
		return new Promise((resolve, reject) => {
			if(user) {
				//throw new Error('The user_id (' + user.user_id + ') already exist');
				return reject(errs.merge_detail(
					errs.ERR_DUPLICATE_USER,
					'The user (' + user.user_id + ') already exist'
				));
			} else {
				// create a promise that generates jwt asynchronously
				//const p = new Promise((resolve, reject) => {
					password.hash(user_password, (err, hashed) => {
						if(err) {
							// 에러로그 DB저장
							log4.saveError(req, res, errs.merge_detail(
								errs.ERR_PASSWORD_HASHING,
								err.message
							));

							//return reject(err);
							return reject(errs.merge_detail(
								errs.ERR_PASSWORD_HASHING,
								err.message
							));
						}

						/*
						const user = new modelUser({
						   user_id: user_id,
						   user_name: 'user_name',
						   user_password: hashed
						});

						or

						 */

						// Create model instance (= document)
						let user = new modelUser();
						user.user_id = user_id;
						user.user_name = user_name;
						user.user_password = hashed; // 암호화 된 비밀번호
						user.authority = authority;
						//user.reg_date = new Date().toFormat('YYYY-MM-DD HH24:MI:SS');
						//user.mod_date = null;

						// Document instance method
						user.save(function(err) { //insert는 _id가 있어도 같은 동작을 하지만 , save는 중복체크를하여 _id가 있으면 update
							if(err) {
								// 에러로그 DB저장
								log4.saveError(req, res, errs.merge_detail(
									errs.ERR_DATABASE_FAILED_INSERT_MONGO,
									err.message
								));

								//return reject({ message: 'The user (' + user_id + ') does not exist' });
								return reject(errs.merge_detail(
									errs.ERR_DATABASE_FAILED_INSERT_MONGO,
									err.message
								));
							}

							logger.info('*** created new user ***\n' + user);

							resolve(user);
						});
					});
				//});

				//return p;
			}
		});
	};
/*
	// count the number of the user
	const count = (user) => {
		newUser = user;
		return User.count({}).exec();
	}

	// assign admin if count is 1
	const assign = (count) => {
		if(count === 1) {
			return newUser.assignAdmin();
		} else {
			// if not, return a promise that returns false
			return Promise.resolve(false);
		}
	}

	// respond to the client
	const respond = (isAdmin) => {
		res.json({
			message: 'registered successfully',
			admin: isAdmin ? true : false
		});
	}
*/
	// 2-4. 응답 처리
	const respond = (user) => {
		/*res.json({
			message: 'registered successfully',
			info: user
		});*/
		res.json(
			res_builder.success( 'The user (' + user.user_id + ') was registered successfully' )
		);
	};

	// 2-5. 에러 처리
	const onError = (error) => {
		/*res.status(409).json({
			message: error.message
		});*/
		res.json(
			res_builder.error( error )
		);
	};

	// Define Promise
	//modelUser.findOneByUserId(user_id)  // 1. 사용자 조회 (findOneByUserId: model에서 정의한 메소드)
	//.then(create)					   // 2. 비밀번호 암호화하여 사용자 insert
////	.then(count)					  // 등록된 사용자수 확인
////	.then(assign)					 // 어드민 여부 체크
	//.then(respond)					  // 3. 응답처리
	//.catch(onError)					 // 예외처리

	// 2. 비동기 동작의 흐름 제어 (promise)
	const params = req.body;

	// 파라메터 병합
	_.assign(params, req.query, req.params);
	//console.log(params);

	// validation Keys
	const keys = ['user_id', 'user_name', 'user_password', 'authority'];

	// 2-1. 파라메터 유효성 검사
	validate.by_promise(params, keys).then(() => {
		// 2-2. 사용자 조회
		return modelUser.findOneByUserId(user_id);
	}).then((user) => {
		// 2-3. 비밀번호 암호화하여 사용자 insert
		return create(user);
	}).then((user) => {
		// 2-4. 응답 처리
		return respond(user);
	}).catch((error) => {
		// 2-5. 에러 처리
		return onError(error);
	});

};

/**
 * 2. 사용자 수정
 *  [PUT] /api/auth/update/:user_id
 *  - 사용자 조회
 *  - 비밀번호 암호화
 *  - 사용자 정보 수정
 *
 * @param user_id 사용자 ID
 * @body user_name 사용자명
 * @body user_password 사용자 비밀번호
 * @body authority 권한
 */
exports.update = (req, res) => {
	// 1. request data
	const user_id = req.params.user_id;
	const {user_name, user_password, authority} = req.body;

	//let dt = new Date();
	//let d = dt.toFormat('YYYY-MM-DD HH24:MI:SS');

	// 2-3. 비밀번호 암호화
	const passwordHash = (user) => {
		return new Promise((resolve, reject) => {
			if(!user) {
				//return reject({ message: 'The user (' + user_id + ') does not exist' });
				return reject(errs.merge_detail(
					errs.ERR_USER_NOT_EXIST,
					'The user (' + user_id + ') does not exist'
				));
			}

			password.hash(user_password, (err, hashed) => {
				if(err) {
					// 에러로그 DB저장
					log4.saveError(req, res, errs.merge_detail(
						errs.ERR_PASSWORD_HASHING,
						err.message
					));

					//return reject(err);
					return reject(errs.merge_detail(
						errs.ERR_PASSWORD_HASHING,
						err.message
					));
				}

				// 업데이트 할 정보
				let updateValues = { $set: {
						user_name: user_name,
						user_password: hashed, // 암호화 된 비밀번호
						authority: authority,
						mod_date: new Date()
					}
				};

				// return User info
				//user.user_password = hashed;
				return resolve(updateValues);
			});
		});
	}

	// 2-4. 사용자 정보 수정
	const updateUser = (updateValues) => {
		return new Promise((resolve, reject) => {
			if(!updateValues) {
				// user does not exist
				throw new Error('updateValues do not exist');
			} else {
				// create a promise that generates jwt asynchronously
				//const p = new Promise((resolve, reject) => {
					//modelUser.findOneAndUpdate({ user_id: user_id }, updateValues, function(err, output) {
					modelUser.updateOne({ user_id: user_id }, updateValues, function(err, output) {
						logger.info('*** updated the user (' + req.params.user_id + ') ***');

						if(err) {
							// 에러로그 DB저장
							log4.saveError(req, res, errs.merge_detail(
								errs.ERR_DATABASE_FAILED_UPDATE_MONGO,
								err.message
							));

							//reject(err);
							reject(errs.merge_detail(
								errs.ERR_DATABASE_FAILED_UPDATE_MONGO,
								err.message
							));
						}

						resolve(output);
					});
				//});

				//return p;
			}
		});
	};

	// 2-5. 응답 처리
	const respond = (output) => {
		/*res.json({
			message: 'The user (' + user_id + ') info was updated successfully',
			output
		});*/
		res.json(
			res_builder.success( 'The user (' + user_id + ') was updated successfully' )
		);
	};

	// 2-6. 에러 처리
	const onError = (error) => {
		/*res.status(403).json({
			message: error.message
		});*/

		res.json(
			res_builder.error( error )
		);
	};

	// Define Promise
	//User.findOne({user_id: req.body.user_id})

	//modelUser.findOneByUserId(user_id)  // 1. 사용자 조회 (findOneByUserId: model에서 정의한 메소드)
	//.then(passwordHash)				 // 2. 비밀번호 암호화
	//.then(updateUser)				   // 3. 사용자 정보 수정
	//.then(respond)					  // 4. 응답처리
	//.catch(onError)					 // 예외처리

	// 2. 비동기 동작의 흐름 제어 (promise)
	const params = req.body;

	// 파라메터 병합
	_.assign(params, req.query, req.params);
	//console.log(params);

	// validation Keys
	const keys = ['user_name', 'authority'];

	// 2-1. 파라메터 유효성 검사
	validate.by_promise(params, keys).then(() => {
		// 2-2. 사용자 조회
		return modelUser.findOneByUserId(user_id);
	}).then((user) => {
		// 2-3. 비밀번호 암호화
		return passwordHash(user);
	}).then((updateValues) => {
		// 2-4. 사용자 정보 수정
		return updateUser(updateValues);
	}).then((output) => {
		// 2-5. 응답 처리
		return respond(output);
	}).catch((error) => {
		// 2-6. 에러 처리
		return onError(error);
	});
};

/**
 * 3. 사용자 삭제
 *  [DELETE] /api/auth/delete/:user_id
 *  - 사용자 조회
 *  - 사용자 삭제
 *
 * @param user_id 사용자 ID
 */
exports.delete = (req, res) => {
	// 1. request data
	const user_id = req.params.user_id;

	// 2-3. 사용자 삭제
	const deleteUser = (user) => {
		return new Promise((resolve, reject) => {
			if(!user) {
				//return res.status(404).json({error: 'The user (' + user_id + ') not exist'});
				return reject(errs.merge_detail(
					errs.ERR_USER_NOT_EXIST,
					'The user (' + user_id + ') does not exist'
				));
			}

			//const p = new Promise((resolve, reject) => {
				//User.remove({ user_id: req.params.user_id }, function(err, output) {
				modelUser.deleteOne({ user_id: user.user_id }, function(err, output) {
					logger.info('*** deleted the user (' + user_id + ') ***');

					if(err) {
						// 에러로그 DB저장
						log4.saveError(req, res, errs.merge_detail(
							errs.ERR_DATABASE_FAILED_DELETE_MONGO,
							err.message
						));

						//reject(err);
						reject(errs.merge_detail(
							errs.ERR_DATABASE_FAILED_DELETE_MONGO,
							err.message
						));
					}

					resolve(output);
				});
			//});

			//return p;
		});
	};

	// 2-4. 응답 처리
	const respond = (output) => {
		/*res.json({
			message: 'The user (' + user_id + ') was deleted successfully',
			output
		});*/
		res.json(
			res_builder.success( 'The user (' + user_id + ') was deleted successfully' )
		);
	};

	// 2-5. 에러 처리
	const onError = (error) => {
		/*res.status(403).json({
			message: error.message
		});*/

		res.json(
			res_builder.error( error )
		);
	};

	// Define Promise
	////User.findOne({user_id: req.body.user_id})
	//modelUser.findOneByUserId(user_id)  // 1. 사용자 조회 (findOneByUserId: model에서 정의한 메소드)
	//.then(deleteUser)				   // 2. 사용자 삭제
	//.then(respond)					  // 3. 응답처리
	//.catch(onError)					 // 예외처리


	// 2. 비동기 동작의 흐름 제어 (promise)
	const params = req.body;

	// 파라메터 병합
	_.assign(params, req.query, req.params);
	//console.log(params);

	// validation Keys
	const keys = ['user_id'];

	// 2-1. 파라메터 유효성 검사
	validate.by_promise(params, keys).then(() => {
		// 2-2. 사용자 조회
		return modelUser.findOneByUserId(user_id);
	}).then((user) => {
		// 2-3. 사용자 삭제
		return deleteUser(user);
	}).then((output) => {
		// 2-4. 응답 처리
		return respond(output);
	}).catch((error) => {
		// 2-5. 에러 처리
		return onError(error);
	});
};

/**
 * 4. 로그인
 *  [POST] /api/auth/login
 *  - 사용자 조회
 *  - 비밀번호 검증
 *  - 토큰 발급
 *
 * @body user_id 사용자 ID
 * @body user_password 사용자 비밀번호
 */
exports.login = (req, res) => {
	// 1. request data
	const {user_id, user_password} = req.body;
	//const secret = req.app.get('jwt-secret');
/*
	// 조회 테스트...
	modelUser.find()
	//.where('user_name').equals('sysadmin') // equals:일치, ne:불일치
	//.where('birth').gt(20) // gt:초과, lt:미만, gte:이상, lte:이하
	.where('authority').in(['admin', 'normal']) // in:배열 안의 값 중 하나라도 일치하는지, nin:하나도 일치 안 하는지, all:모두 다 일치하는 지
	.sort('-reg_date mod_date') // 정렬 (default:오름차순, -:내림차순)
	//.skip(5) // 건너뛰기
	.limit(5) // 개수제한
	.select('_id user_id user_name authority') // 조회할 컬럼 (_id는 빼지 않는 이상 기본 출력됩니다. 특정 필드를 빼고싶다면 앞에 -(빼기)를 붙이면 됩니다.)
	.exec(function(err, result) {
		console.log(result);
	});
*/

	// 2-3. 비밀번호 검증
	const passwordVerify = (user) => {
		return new Promise((resolve, reject) => {
			if(!user) {
				//return reject({ message: 'The user (' + user_id + ') does not exist' });
				return reject(errs.merge_detail(
					errs.ERR_USER_NOT_EXIST,
					'The user (' + user_id + ') does not exist'
				));
			}

			// 비밀번호 비교
			password.compare(user_password, user.user_password, (err, is_correct) => {
				if(err) {
					// 에러로그 DB저장
					log4.saveError(req, res, errs.merge_detail(
						errs.ERR_PASSWORD_COMPARING,
						err.message
					));

					//return reject(err);
					return reject(errs.merge_detail(
						errs.ERR_PASSWORD_COMPARING,
						err.message
					));
				} else if(!is_correct) {
					//return reject({message: 'invalid user_password'});
					return reject(errs.merge_detail(
						errs.ERR_INVALID_USERNAME_OR_PASSWORD,
						'invalid user_password'
					));
				}

				// return User info
				return resolve(user);
			});
		});
	};

	// 2-4. 토큰생성
	const generateToken = (user) => {
		return new Promise((resolve, reject) => {
			if(!user) {
				// user does not exist
				//throw new Error('user does not exist');
				return reject(errs.merge_detail(
					errs.ERR_USER_NOT_EXIST,
					'The user (' + user_id + ') does not exist'
				));
			} else {
				// create a promise that generates jwt asynchronously
				//const p = new Promise((resolve, reject) => {
					// 토큰의 내용(payload)
					const payload = {
						_id: user._id,
						user_id: user.user_id
					};

					// do the database authentication here, with user name and password combination.
					let accessToken = '';
					let refreshToken = '';

					// create accessToken
					jwt.sign(payload, jwt_key_access, { expiresIn: token_expire_sec_access }, (err, token) => {
						if(err) {
							// 에러로그 DB저장
							log4.saveError(req, res, errs.merge_detail(
								errs.ERR_FAILED_TO_CREATE_ACCESS_TOKEN,
								err.message
							));

							//reject(err);
							reject(errs.merge_detail(
								errs.ERR_FAILED_TO_CREATE_ACCESS_TOKEN,
								err.message
							));
						} else {
							accessToken = token;

							// create refreshToken
							jwt.sign(payload, jwt_key_refresh, { expiresIn: token_expire_sec_refresh }, (err, token) => {
								if(err) {
									// 에러로그 DB저장
									log4.saveError(req, res, errs.merge_detail(
										errs.ERR_FAILED_TO_CREATE_REFRESH_TOKEN,
										err.message
									));
		
									//reject(err);
									reject(errs.merge_detail(
										errs.ERR_FAILED_TO_CREATE_REFRESH_TOKEN,
										err.message
									));
								} else {
									refreshToken = token;

									//userInfo.setUserInfo(req, user);

									const tokenInfo = {
										"accessToken": accessToken,
										"refreshToken": refreshToken,
									}

									// refreshToken DB에 저장
									// 업데이트 할 정보
									let updateValues = { $set: {
											refreshToken: refreshToken,
											//mod_date: new Date()
										}
									};

									modelUser.updateOne({ user_id: user_id }, updateValues, function(err, output) {
										logger.info('*** updated the refreshToken (' + user_id + ') ***');

										if(err) {
											// 에러로그 DB저장
											log4.saveError(req, res, errs.merge_detail(
												errs.ERR_DATABASE_FAILED_UPDATE_MONGO,
												err.message
											));

											//reject(err);
											reject(errs.merge_detail(
												errs.ERR_DATABASE_FAILED_UPDATE_MONGO,
												err.message
											));
										}

										//resolve(output);
										resolve(tokenInfo);
									});
								}
							});
						}
					});

				//});

				//return p;
			}
		});
	};

	// 2-5. 응답 처리
	const respond = (token) => {
		/*res.json({
			code: 200,
			detail: 'logged in successfully',
			token
		});*/

		const msg = {
			"msg": 'logged in successfully',
			"token": token
		}
		res.json(
			res_builder.success( msg )
		);
	};

	// 2-6. 에러 처리
	const onError = (error) => {
		/*res.status(403).json({
			message: error.message
		});*/
		res.json(
			res_builder.error( error )
		);
	};

	// Define Promise
	////User.findOne({user_id: req.body.user_id})
	//modelUser.findOneByUserId(user_id)  // 1. 사용자 조회 (findOneByUserId: model에서 정의한 메소드)
	//.then(passwordVerify)			   // 2. 비밀번호 검증
	//.then(generateToken)				// 3. 토큰생성
	//.then(respond)					  // 4. 토큰발급 및 응답처리
	//.catch(onError)					 // 예외처리

	// 2. 비동기 동작의 흐름 제어 (promise)
	const params = req.body;

	// 파라메터 병합
	_.assign(params, req.query, req.params);
	//console.log(params);

	// validation Keys
	const keys = ['user_id', 'user_password'];

	// 2-1. 파라메터 유효성 검사
	validate.by_promise(params, keys).then(() => {
		// 2-2. 사용자 조회
		return modelUser.findOneByUserId(user_id);
	}).then((user) => {
		// 2-3. 비밀번호 검증
		return passwordVerify(user);
	}).then((user) => {
		// 2-4. 토큰생성
		return generateToken(user);
	}).then((token) => {
		// 2-5. 응답 처리
		return respond(token);
	}).catch((error) => {
		// 2-6. 에러 처리
		return onError(error);
	});
};

/**
 * 5. 새 토큰 발급
 *  [GET] /api/auth/requestToken
 *  - 사용자의 refreshToken 조회
 *  - 토큰 발급
 *
 * @param user_id 사용자 ID
 */
exports.requestToken = (req, res) => {
	// 1. request data
	const user_id = req.query.user_id;

	// 2-3. 토큰생성
	const generateToken = (user) => {
		return new Promise((resolve, reject) => {
			if(!user) {
				// user does not exist
				//throw new Error('user does not exist');
				return reject(errs.merge_detail(
					errs.ERR_USER_NOT_EXIST,
					'The user (' + user_id + ') does not exist'
				));
			} else {
				// 1. refresh token 체크
				jwt.verify(user.refreshToken, jwt_key_refresh, (err, decoded) => {
					//if(err) reject(err);
					if(err) {
						if(err.message === 'jwt expired') {
							//console.log(user_id + ' refreshToken 만료!');

							// refresh token 만료시 client에게 로그인 요청
							reject(errs.merge_detail(
								errs.ERR_JWT_VERIFY_FAIL,
								//err.message
								'Try to login again'
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

					// 2. access token 발급
					// 토큰의 내용(payload)
					const payload = {
						_id: user._id,
						user_id: user.user_id
					};

					// create accessToken
					jwt.sign(payload, jwt_key_access, { expiresIn: token_expire_sec_access }, (err, token) => {
						if(err) {
							// 에러로그 DB저장
							log4.saveError(req, res, errs.merge_detail(
								errs.ERR_FAILED_TO_CREATE_ACCESS_TOKEN,
								err.message
							));

							//reject(err);
							reject(errs.merge_detail(
								errs.ERR_FAILED_TO_CREATE_ACCESS_TOKEN,
								err.message
							));
						}

						//userInfo.setUserInfo(req, user);

						const tokenInfo = {
							"accessToken": token
						}

						resolve(tokenInfo) ;
					});
				});
			}
		});
	};

	// 2-4. 응답 처리
	const respond = (token) => {
		/*res.json({
			code: 200,
			detail: 'created new token in successfully',
			token
		});
		*/
		const msg = {
			"msg": 'created new token in successfully',
			"token": token
		}
		res.json(
			res_builder.success( msg )
		);
	};

	// 2-5. 에러 처리
	const onError = (error) => {
		/*res.status(403).json({
			message: error.message
		});*/
		res.json(
			res_builder.error( error )
		);
	};

	// Define Promise
	////User.findOne({user_id: req.body.user_id})
	//modelUser.findOneByUserId(user_id)  // 1. 사용자 조회 (findOneByUserId: model에서 정의한 메소드)
	//.then(generateToken)				// 2. 토큰생성
	//.then(respond)					  // 3. 토큰발급 및 응답처리
	//.catch(onError)					 // 예외처리

	// 2. 비동기 동작의 흐름 제어 (promise)
	const params = req.body;

	// 파라메터 병합
	_.assign(params, req.query, req.params);
	//console.log(params);

	// validation Keys
	const keys = ['user_id'];

	// 2-1. 파라메터 유효성 검사
	validate.by_promise(params, keys).then(() => {
		// 2-2. 사용자 조회
		return modelUser.findOneByUserId(user_id);
	}).then((user) => {
		// 2-3. 토큰생성
		return generateToken(user);
	}).then((token) => {
		// 2-4. 응답 처리
		return respond(token);
	}).catch((error) => {
		// 2-5. 에러 처리
		return onError(error);
	});
};











// transaction 테스트
exports.transaction = (req, res) => {
	// Boilerplate: connect to DB
	const mongoose = require('mongoose');
	const uri = 'mongodb://localhost:27017,localhost:27018,localhost:27019/txn';
	//await mongoose.connect(uri, { replicaSet: 'rs' });
	mongoose.connect(uri, { replicaSet: 'rs' });

	//await mongoose.connection.dropDatabase();
	mongoose.connection.dropDatabase();
	const Account = mongoose.model('Account', new mongoose.Schema({
	name: String, balance: Number
	}));

	// Insert accounts and transfer some money
	//await Account.create([{ name: 'A', balance: 5 }, { name: 'B', balance: 10 }]);
	Account.create([{ name: 'A', balance: 5 }, { name: 'B', balance: 10 }]);

	//await transfer('A', 'B', 4); // Success
	transfer('A', 'B', 4); // Success

	try {
		// Fails because then A would have a negative balance
		//await transfer('A', 'B', 2);
		transfer('A', 'B', 2);
	} catch (error) {
		error.message; // "Insufficient funds: 1"
	}

	// The actual transfer logic
	async function transfer(from, to, amount) {
	//const session = await mongoose.startSession();
	const session = mongoose.startSession();
	session.startTransaction();

	try {
		const opts = { session, new: true };
		//const A = await Account.
		const A = Account.
		findOneAndUpdate({ name: from }, { $inc: { balance: -amount } }, opts);

		if(A.balance < 0) {
			// If A would have negative balance, fail and abort the transaction
			// `session.abortTransaction()` will undo the above `findOneAndUpdate()`
			throw new Error('Insufficient funds: ' + (A.balance + amount));
		}

		//const B = await Account.
		const B = Account.
		findOneAndUpdate({ name: to }, { $inc: { balance: amount } }, opts);

		//await session.commitTransaction();
		session.commitTransaction();
		session.endSession();

		return { from: A, to: B };
	} catch (error) {
		// If an error occurred, abort the whole transaction and
		// undo any changes that might have happened
		//await session.abortTransaction();
		session.abortTransaction();
		session.endSession();
		throw error; // Rethrow so calling function sees error
	}
	}
};