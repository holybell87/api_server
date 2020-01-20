// DEPENDENCIES
const router = require('express').Router()
const authMiddleware = require('../middlewares/authMiddleware');

const auth = require('./auth');
const user = require('./user');
const chat = require('./chat');
const download = require('./download');
const keyword = require('./keyword');

router.use('/auth', auth); // /api/auth
router.use('/user', authMiddleware); // /api/user 로 요청오는 것들은 모두 토큰 검증 적용
router.use('/user', user); // /api/user
router.use('/chat', chat); // /api/chat
router.use('/download', download); // /api/download
router.use('/keyword', keyword); // /api/keyword

module.exports = router;