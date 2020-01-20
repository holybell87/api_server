// DEPENDENCIES
const router = require('express').Router();
const controller = require('./_1.user');

// CONFIGURE ROUTER 
router.get('/list', controller.list); // 사용자 조회
//router.post('/assign-admin/:username', controller.assignAdmin);
router.post('/fileupload', controller.fileupload); // 파일 업로드
router.get('/filedownload', controller.filedownload) // 파일 다운로드
router.get('/filelist', controller.filelist); // 사용자 파일조회

module.exports = router;