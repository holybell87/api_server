// DEPENDENCIES
const router = require('express').Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const controller = require('./_1.chat');

// CONFIGURE ROUTER
router.use('/room_list', authMiddleware); // /api/chat/add_room 로 요청오는 것들은 모두 토큰 검증
router.get('/room_list', controller.room_list); // 채팅방 목록 조회
router.get('/room_list/:user_id', controller.room_list_of_user); // 특정 유저의 채팅방 목록 조회
router.post('/add_room', controller.add_room); // 신규 채팅방 등록
router.put('/out_room/:user_id', controller.out_room); // 사용자 채팅방 나가기

module.exports = router;