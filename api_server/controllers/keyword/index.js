// DEPENDENCIES
const router = require('express').Router();
const controller = require('./_1.keyword_result');

// CONFIGURE ROUTER 
router.get('/list', controller.list); // 키워드 분석결과 조회
router.get('/list_sub', controller.list_sub); // 키워드별 콜 건수 조회
router.get('/list_sub2', controller.list_sub2); // 키워드별 콜 건수 조회

router.get('/list2', controller.list2); // 키워드 분석결과 조회
router.get('/allList', controller.allList); // 키워드 분석결과 조회

module.exports = router;