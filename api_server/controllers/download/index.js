// DEPENDENCIES
const router = require('express').Router();
const controller = require('./_1.excel');

// CONFIGURE ROUTER 
//router.get('/filedownload', controller.filedownload) // 파일 다운로드
router.get('/exceldownload', controller.exceldownload) // 엑셀 다운로드

module.exports = router;