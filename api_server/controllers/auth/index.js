// DEPENDENCIES
const router = require('express').Router();
const controller = require('./_1.auth');
//const authMiddleware = require('../../middlewares/authMiddleware');

// CONFIGURE ROUTER
router.post('/register', controller.register);          // 사용자 등록
router.put('/update/:user_id', controller.update);      // 사용자 수정
router.delete('/delete/:user_id', controller.delete);   // 사용자 삭제
router.post('/login', controller.login);                // 로그인
router.get('/requestToken', controller.requestToken);   // 새 토큰 발급




router.get('/transaction', controller.transaction);     // 트랜잭션 테스트
//router.use('/check', authMiddleware);                 // 토큰 검증용 미들웨어
//router.get('/check', controller.check);

module.exports = router;