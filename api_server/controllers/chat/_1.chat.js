/*
----------------------------------------------------------------------
[ROUTE]							[METHOD]	[DESCRIPTION]
----------------------------------------------------------------------
/api/chat/room_list				GET			등록되어 있는 모든 채팅방 목록을 조회한다.
/api/chat/room_list/:user_id	GET			특정 유저의 채팅방 목록을 조회한다.
/api/chat/add_room				POST		신규 채팅방을 생성한다.
/api/chat/out_room/:user_id		PUT			사용자 채팅방을 아웃처리 한다.
----------------------------------------------------------------------
*/

// DEPENDENCIES
const errs = require('../../commons/errs');
const log4 = require('../../config/log4');
const res_builder = require('../../commons/response_builder');

// DEFINE MODEL
const modelUser = require('../../models/user');
const modelChat = require('../../models/chat');
const modelChatByUser = require('../../models/chat_by_user');

//require('date-utils'); // npm install date-utils

const logger = log4.getLogger('_1.chat');

/**
 * 1. 채팅룸 조회
 *  [GET] /api/chat/room_list
 *  - 채팅룸 조회
 *
 * @param pageNum 현재 페이지 번호
 * @param limit 조회할 건수
 */
exports.room_list = (req, res) => {
	// request data
	// 현재 페이지 번호
	let pageNum = req.query.pageNum;
	if(pageNum == null) pageNum = 1;
	pageNum = Number(pageNum); // 숫자형으로 치환

	let limitSize = req.query.limit;
	if(limitSize == null) limitSize = 10; // 10개씩 조회 (default)
	limitSize = Number(limitSize); // 숫자형으로 치환

	let skipSize = (pageNum-1)*limitSize;
	let pageTotalCnt = 1;

	modelChat.countDocuments({  }, function(err, totalCount) {
		// db에서 날짜순으로 데이터들을 가져옴
		if(err) throw err;

		// 페이지 개수
		pageTotalCnt = Math.ceil(totalCount/limitSize);

		modelChat.find({/*{ use_yn: 'Y' }*/}) // 조회조건
			.sort({reg_date:-1}) // 정렬 조건
			.skip(skipSize) // skip 건수
			.limit(limitSize) // 조회건수
			.exec(function(err, result) {
				res.json(
					res_builder.select( result, pageNum, pageTotalCnt, limitSize, totalCount )
				);
			});
	});
};

/**
 * 2. 채팅룸 조회
 *  [GET] /api/chat/room_list/:user_id
 *  - 채팅룸 조회
 *
 * @param pageNum 현재 페이지 번호
 * @param limit 조회할 건수
 */
exports.room_list_of_user = (req, res) => {
	// request data
	let user_id = req.params.user_id;

	// 현재 페이지 번호
	let pageNum = req.query.pageNum;
	if(pageNum == null) pageNum = 1;
	pageNum = Number(pageNum); // 숫자형으로 치환

	let limitSize = req.query.limit;
	if(limitSize == null) limitSize = 10; // 10개씩 조회 (default)
	limitSize = Number(limitSize); // 숫자형으로 치환

	let skipSize = (pageNum-1)*limitSize;
	let pageTotalCnt = 1;

	const findRoomsByUserId = (roomsCount) => {
		return new Promise((resolve, reject) => {
			// 페이지 개수
			pageTotalCnt = Math.ceil(roomsCount/limitSize);

			modelChatByUser.find({user_id: user_id}) // 조회조건
				.sort({reg_date:-1}) // 정렬 조건
				.skip(skipSize) // skip 건수
				.limit(limitSize) // 조회건수
				.exec(function(err, result) {
					if(err) {
						// 에러로그 DB저장
						log4.saveError(req, res, errs.merge_detail(
							errs.ERR_DATABASE_FAILED_SELECT_MONGO,
							err.message
						));

						return reject(errs.merge_detail(
							errs.ERR_DATABASE_FAILED_SELECT_MONGO,
							err.message
						));
					}

					const arrJson = {};
					arrJson.result = result;
					arrJson.pageNum = pageNum;
					arrJson.pageTotalCnt = pageTotalCnt;
					arrJson.limitSize = limitSize;
					arrJson.roomsCount = roomsCount;

					resolve(arrJson);
				});
		});
	};

	// respond to the client
	const respond = (rooms) => {
		res.json(
			res_builder.select( rooms.result, rooms.pageNum, rooms.pageTotalCnt, rooms.limitSize, rooms.roomsCount )
		);
	};

	// error occured
	const onError = (error) => {
		res.json(
			res_builder.error( error )
		);
	};

	// Define Promise
	modelChatByUser.countByUserId(user_id)
	.then(findRoomsByUserId)
	.then(respond)
	.catch(onError)
};

/**
 * 3. 신규 채팅방 등록
 *  [POST] /api/chat/add_room
 *  - 채팅방 총 갯수 조회
 *  - 채팅방 insert
 */
exports.add_room = (req, res) => {
	const insert = (roomsCount) => {
		return new Promise((resolve, reject) => {
			if(!roomsCount || roomsCount < 0) {
				return reject(errs.merge_detail(
					errs.ERR_DATABASE_FAILED_SELECT_MONGO,
					'Room does not exist'
				));
			} else {
				const newRoomId = roomsCount + 1; // 신규 채팅방 id

				let chat = new modelChat();
				chat.room_id = newRoomId;
				//chat.reg_date = new Date().toFormat('YYYY-MM-DD HH24:MI:SS');
				//chat.mod_date = null;

				logger.info('*** created new chat room ***\n' + chat);

				chat.save(function(err) { //insert는 _id가 있어도 같은 동작을 하지만 , save는 중복체크를하여 _id가 있으면 update
					if(err) {
						// 에러로그 DB저장
						log4.saveError(req, res, errs.merge_detail(
							errs.ERR_DATABASE_FAILED_INSERT_MONGO,
							err.message
						));

						return reject(errs.merge_detail(
							errs.ERR_DATABASE_FAILED_INSERT_MONGO,
							err.message
						));
					}

					resolve(chat);
				});
			}
		});
	};


	// respond to the client
	const respond = (chat) => {
		res.json(
			res_builder.success( 'The room_id (' + chat.room_id + ') was registered successfully' )
		);
	};

	// error occured
	const onError = (error) => {
		res.json(
			res_builder.error( error )
		);
	};

	// Define Promise
	modelChat.countDocuments()		  // 1. 채팅방 총 갯수 조회
	.then(insert)					   // 2. 채팅방 insert
	.then(respond)					  // 3. 응답처리
	.catch(onError)					 // 예외처리
};

/**
 * 4. 사용자 채팅방 아웃
 *  [PUT] /api/chat/out_room/:user_id
 *  - 사용자 조회
 *  - 사용자 채팅방 나가기
 * 
 * @param user_id 사용자 ID
 * @body room_id 채팅방 ID
 */
exports.out_room = (req, res) => {
	// request data
	const user_id = req.params.user_id;
	const room_id = req.body.room_id;

	// 사용자 정보 수정
	const updateRoom = (updateValues) => {
		return new Promise((resolve, reject) => {
			// 업데이트 할 정보
			let updateValues = { $set: {
				out_yn: 'Y',
				mod_date: new Date()
				}
			};

			modelChatByUser.updateOne({ room_id: room_id, user_id: user_id }, updateValues, function(err, output) {
				logger.info('*** updated the room (room_id: ' + room_id + ' / user_id: ' + user_id + ') ***');

				if(err) {
					// 에러로그 DB저장
					log4.saveError(req, res, errs.merge_detail(
						errs.ERR_DATABASE_FAILED_UPDATE_MONGO,
						err.message
					));

					reject(errs.merge_detail(
						errs.ERR_DATABASE_FAILED_UPDATE_MONGO,
						err.message
					));
				}

				resolve(output);
			});
		});
	};

	const respond = (output) => {
		/*res.json({
			message: 'The user (' + user_id + ') info was updated successfully',
			output
		});*/
		res.json(
			res_builder.success( 'The room info (room_id: ' + room_id + '/ user_id: ' + user_id + ') was updated successfully' )
		);
	};

	// error occured
	const onError = (error) => {
		res.json(
			res_builder.error( error )
		);
	};

	// Define Promise
	//User.findOne({user_id: req.body.user_id})
	modelUser.findOneByUserId(user_id)  // 1. 사용자 조회 (findOneByUserId: model에서 정의한 메소드)
	.then(updateRoom)				   // 3. 사용자 채팅방 정보 수정
	.then(respond)					  // 4. 응답처리
	.catch(onError)					 // 예외처리
};