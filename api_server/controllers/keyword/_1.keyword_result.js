/*
----------------------------------------------------------------------
[ROUTE]							[METHOD]	[DESCRIPTION]
----------------------------------------------------------------------
/api/keyword/list				GET			키워드 분석 결과를 조회한다.
/api/keyword/list_sub			GET			키워드별 콜 건수를 조회한다.
----------------------------------------------------------------------
*/

// DEPENDENCIES
const errs = require('../../commons/errs');
const fs = require('fs'); // npm install --save fs
const log4 = require('../../config/log4');
//const mime = require('mime'); // npm install mime
const res_builder = require('../../commons/response_builder');

// DEFINE MODEL
const modelKeyword = require('../../models/keyword_result');
const modelKeyword2 = require('../../models/keyword_result2');
const modelKeywordDaily = require('../../models/keyword_result_daily');

//require('date-utils'); // npm install date-utils

const logger = log4.getLogger('_1.keyword_result');

/*
// 트랜잭션 테스트 (mongoDB v4.0 이상 지원)
const modelTest = require('../../models/test');
exports.transaction = (req, res) => {
	const session = modelTest.startSession();
	session.startTransaction();

	try {
		const opts = { session };
		const A = modelTest.findOneAndUpdate(
						{ user_id: 'test' }, { $set: { user_name: '테스트1' } }, opts);
	
		const B = modelTest(
						{ user_id: 'test2', user_name: '테스트2', user_password: '1234'})
						.save(opts);
	
		session.commitTransaction();
		//session.endSession();
		console.log('ok');
		return true;
	} catch (error) {
		console.log('fail');
		// If an error occurred, abort the whole transaction and
		// undo any changes that might have happened
		session.abortTransaction();
		//session.endSession();
		throw error; 
	} finally {
		session.endSession();

		res.json({
			success: true
		});
	}
};
*/


/**
 * 1. 키워드 분석결과 조회 (jqGrid 연동)
 *  [GET] /api/keyword/list
 * /api/keyword/list?_search=false
 * 					&nd=1565156692118
 * 					&rows=10
 * 					&page=1
 * 					&sidx=date
 * 					&sord=desc
 * 					&param=%7B%22fromDate%22%3A%2220151016%22%2C%22toDate%22%3A%2220151017%22%7D
 * @param _search 검색여부 (true/false)
 * @param nd ??
 * @param rows 조회할 건수 (limit값)
 * @param page 현재 페이지 번호
 * @param sidx 정렬기준 컬럼
 * @param sord 정렬방법(asc/desc)
 */
exports.list = (req, res) => {
	// request data (GET)
	const { _search, nd, rows, page, sidx, sord, param } = req.query;

	// 추가 parameters
	const jsonData = JSON.parse(param);
	const fromDate = jsonData.fromDate;
	const toDate = jsonData.toDate;
	const agentId = jsonData.agentId;
	const agentNm = jsonData.agentNm;
	const keyword = jsonData.keyword;

	// 현재 페이지 번호
	let pageNum = page;
	if(pageNum == null) pageNum = 1;
	pageNum = Number(pageNum); // 숫자형으로 치환

	let limitSize = rows;
	if(limitSize == null) limitSize = 10; // 10개씩 조회 (default)
	limitSize = Number(limitSize); // 숫자형으로 치환

	let skipSize = (pageNum-1)*limitSize;
	let pageTotalCnt = 1;

	// 정렬조건
	let mysort;
	switch(sidx) {
		case 'start_date':
			mysort = { start_date : sord };
			break;
		case 'rest_send_key':
			mysort = { rest_send_key : sord };
			break;
		case 'agent_id':
			mysort = { agent_id : sord };
			break;
		case 'agent_nm':
			mysort = { agent_nm : sord };
			break;
		case 'center_cd':
			mysort = { center_cd : sord };
			break;
		case 'center_nm':
			mysort = { center_nm : sord };
			break;
		case 'keyword':
			mysort = { keyword : sord };
			break;
		case 'freq':
			mysort = { freq : sord };
			break;
		default:
			mysort = { start_date : sord };
			break;
	}

	// 조회조건
	let myselect = {};
	myselect.start_date = { $gte: fromDate, $lte: toDate };
	if(agentId.length > 0) 	myselect.agent_id = agentId;
	if(agentNm.length > 0) 	myselect.agent_nm = agentNm;
	if(keyword.length > 0)	myselect.keyword = keyword;

	//modelKeyword.countDocuments({ start_date : { $gte: fromDate, $lte: toDate } }, function(err, totalCount) {
	modelKeyword.countDocuments(myselect, function(err, totalCount) {
		if(err) throw err;

		// 페이지 개수
		pageTotalCnt = Math.ceil(totalCount/limitSize);

		//modelKeyword.find({ start_date : { $gte: fromDate, $lte: toDate } }) // 조회조건
		modelKeyword.find(myselect,	// 조회조건
			{ '_id': false, 'start_date': true, 'rest_send_key':true, 'agent_id': true,
			'agent_nm': true, 'center_cd': true, 'center_nm': true, 'keyword': true, 'freq': true }) // 조회할 field 설정
			//.sort({date:-1}) 		// 정렬 조건
			.sort(mysort)			// 정렬 조건
			.skip(skipSize)			// skip 건수
			.limit(limitSize)		// 조회건수
			.exec(function(err, result) {
				if(err) throw err;

				res.json(
					res_builder.selectForjqGrid( result, pageNum, pageTotalCnt, totalCount )
				);
			});
	});
};

/**
 * 2. 키워드별 콜 건수 조회 (jqrid 연동)
 *  [GET] /api/keyword/list_sub
 * /api/keyword/list_sub?_search=false
 * 					&nd=1565156692118
 * 					&rows=10
 * 					&page=1
 * 					&sidx=date
 * 					&sord=desc
 * 					&param=%7B%22fromDate%22%3A%2220151016%22%2C%22toDate%22%3A%2220151017%22%7D
 * @param _search 검색여부 (true/false)
 * @param nd ??
 * @param rows 조회할 건수 (limit값)
 * @param page 현재 페이지 번호
 * @param sidx 정렬기준 컬럼
 * @param sord 정렬방법(asc/desc)
 */
exports.list_sub = (req, res) => {
	// request data (GET)
	const { _search, nd, rows, page, sidx, sord, param } = req.query;

	// 추가 parameters
	const jsonData = JSON.parse(param);
	const fromDate = jsonData.fromDate;
	const toDate = jsonData.toDate;

	// 현재 페이지 번호
	let pageNum = page;
	if(pageNum == null) pageNum = 1;
	pageNum = Number(pageNum); // 숫자형으로 치환

	let limitSize = rows;
	if(limitSize == null) limitSize = 50; // 50개씩 조회 (default)
	limitSize = Number(limitSize); // 숫자형으로 치환

	//let skipSize = (pageNum-1)*limitSize;
	let pageTotalCnt = 1;

	let mysort;
	switch(sidx) {
		case 'keyword':
			mysort = { keyword : sord };
			break;
		case 'count':
			mysort = { count : sord };
			break;
		default:
			mysort = { count : sord };
			break;
	}

	modelKeyword.aggregate([
		{ $match: { 'start_date':{ $gte:fromDate, $lte:toDate} } },
		{ $group: { _id:"$keyword" , count: { $sum: 1 } }},
		{ $project: { _id: 0, keyword: "$_id", count: 1 } },
		//{ $sort: { count: -1 } }
	])
	.sort(mysort) // 정렬 조건
	.limit(limitSize) // 조회건수
	.exec(function(err, result) {
		if(err) throw err;

		//console.log(result);
		res.json(
			res_builder.selectForjqGrid( result, pageNum, pageTotalCnt, limitSize )
		);
	});
};


/**
 * 3. 키워드별 콜 건수 조회 (jqrid 연동)
 *  [GET] /api/keyword/list_sub2
 * /api/keyword/list_sub2?_search=false
 * 					&nd=1565156692118
 * 					&rows=10
 * 					&page=1
 * 					&sidx=date
 * 					&sord=desc
 * 					&param=%7B%22fromDate%22%3A%2220151016%22%2C%22toDate%22%3A%2220151017%22%7D
 * @param _search 검색여부 (true/false)
 * @param nd ??
 * @param rows 조회할 건수 (limit값)
 * @param page 현재 페이지 번호
 * @param sidx 정렬기준 컬럼
 * @param sord 정렬방법(asc/desc)
 */
exports.list_sub2 = (req, res) => {
	// request data (GET)
	const { _search, nd, rows, page, sidx, sord, param } = req.query;

	// 추가 parameters
	const jsonData = JSON.parse(param);
	const fromDate = jsonData.fromDate;
	const toDate = jsonData.toDate;

	// 현재 페이지 번호
	let pageNum = page;
	if(pageNum == null) pageNum = 1;
	pageNum = Number(pageNum); // 숫자형으로 치환

	let limitSize = rows;
	if(limitSize == null) limitSize = 50; // 50개씩 조회 (default)
	limitSize = Number(limitSize); // 숫자형으로 치환

	let skipSize = (pageNum-1)*limitSize;
	let pageTotalCnt = 1;

	let mysort;
	switch(sidx) {
		case 'start_date':
			mysort = { start_date : sord };
			break;
		case 'keyword':
			mysort = { keyword : sord };
			break;
		case 'freq':
			mysort = { freq : sord };
			break;
		case 'reckey_cnt':
			mysort = { reckey_cnt : sord };
			break;
		default:
			mysort = { reckey_cnt : sord };
			break;
	}

/*
	modelKeywordDaily.aggregate([
		{ $match: { 'start_date':{ $gte:fromDate, $lte:toDate} } },
		{ $group: { _id:"$keyword" , count: { $sum: 1 } }},
		{ $project: { _id: 0, keyword: "$_id", count: 1 } },
		//{ $sort: { count: -1 } }
	])
	.sort(mysort) // 정렬 조건
	.limit(limitSize) // 조회건수
	.exec(function(err, result) {
		if(err) throw err;

		//console.log(result);
		res.json(
			res_builder.selectForjqGrid( result, pageNum, pageTotalCnt, limitSize )
		);
	});
*/
	modelKeywordDaily.find({ start_date : { $gte: fromDate, $lte: toDate } }, // 조회조건
		{ '_id': false, 'start_date': true, 'keyword': true, 'freq': true, 'reckey_cnt': true}) // 조회할 field 설정
		//.sort({date:-1}) // 정렬 조건
		.sort(mysort) // 정렬 조건
		.skip(skipSize) // skip 건수
		.limit(limitSize) // 조회건수
		.exec(function(err, result) {
			if(err) throw err;

			res.json(
				res_builder.selectForjqGrid( result, pageNum, pageTotalCnt, limitSize )
			);
		});
};












/**
 * 4. 키워드 분석결과 조회 (jqrid 연동)
 *  [GET] /api/keyword/list2
 * /api/keyword/list2?_search=false
 * 					&nd=1565156692118
 * 					&rows=10
 * 					&page=1
 * 					&sidx=date
 * 					&sord=desc
 * 					&param=%7B%22fromDate%22%3A%2220151016%22%2C%22toDate%22%3A%2220151017%22%7D
 * @param _search 검색여부 (true/false)
 * @param nd ??
 * @param rows 조회할 건수 (limit값)
 * @param page 현재 페이지 번호
 * @param sidx 정렬기준 컬럼
 * @param sord 정렬방법(asc/desc)
 */
exports.list2 = (req, res) => {
	// request data
	// 현재 페이지 번호
	let pageNum = req.query.page;
	if(pageNum == null) pageNum = 1;
	pageNum = Number(pageNum); // 숫자형으로 치환

	//let limitSize = req.query.perPage;
	let limitSize = req.query.rows;
	if(limitSize == null) limitSize = 10; // 10개씩 조회 (default)
	limitSize = Number(limitSize); // 숫자형으로 치환

	let skipSize = (pageNum-1)*limitSize;
	let pageTotalCnt = 1;

	let sord = req.query.sord;
	if(sord == 'asc') sord = 1;
	else if(sord == 'desc') sord = -1;

	let sidx = req.query.sidx;

	let mysort;
	switch(sidx) {
		case 'start_date':
			mysort = { start_date : sord };
			break;
		case 'rest_send_key':
			mysort = { rest_send_key : sord };
			break;
		case 'agent_id':
			mysort = { agent_id : sord };
			break;
		case 'agent_nm':
			mysort = { agent_nm : sord };
			break;
		case 'emp_no':
			mysort = { emp_no : sord };
			break;
		case 'center_cd':
			mysort = { center_cd : sord };
			break;
		case 'center_nm':
			mysort = { center_nm : sord };
			break;
		case 'added_date':
			mysort = { added_date : sord };
			break;
		default:
			mysort = { start_date : sord };
			break;
	}

	// 조회일자
	const jsonData = JSON.parse(req.query.param); // 추가 param
	const fromDate = jsonData.fromDate;
	const toDate = jsonData.toDate;
/*
	modelKeyword2.find({ start_date : { $gte: fromDate, $lte: toDate } }, // 조회조건
		{ _id: false, keywordInfo: true }) // 조회할 field 설정	
		//.sort({date:-1}) // 정렬 조건
		.sort(mysort) // 정렬 조건
		.skip(skipSize) // skip 건수
		.limit(limitSize) // 조회건수
		.exec(function(err, result) {
			if(err) throw err;

			var arrKeyword = new Array();
			//var keywordInfo = result[0].keywordInfo[0];
			//const result_len = result.length;
			for(var i=0; i<result.length; i++) {
				var keywordInfo = result[i].keywordInfo;

				for(var j=0; j<keywordInfo.length; j++) {
					//console.log(keywordInfo[j]);

					// 키워드만 모아서 배열화 시킴
					arrKeyword.push(keywordInfo[j].keyword);
				}
			}

			//console.log(arrKeyword);
		});
*/


	// 빈값 return
	res.json({
		result: ''
	});

/*
	modelKeyword2.countDocuments({ start_date : { $gte: fromDate, $lte: toDate } }, function(err, totalCount) {
		if(err) throw err;

		// 페이지 개수
		pageTotalCnt = Math.ceil(totalCount/limitSize);

		modelKeyword2.find({ start_date : { $gte: fromDate, $lte: toDate } }) // 조회조건
			//.sort({date:-1}) // 정렬 조건
			.sort(mysort) // 정렬 조건
			.skip(skipSize) // skip 건수
			.limit(limitSize) // 조회건수
			.exec(function(err, result) {
				if(err) throw err;

				res.json(
					res_builder.selectForjqGrid( result, pageNum, pageTotalCnt, limitSize, totalCount )
				);
			});
	});
*/
};

/*
// 배열 합계 구하기 함수
function sum(array) {
	var result = 0.0;
  
	for (var i = 0; i < array.length; i++)
	  result += array[i];
  
	return result;
  }
  
  
  // 배열 평균 구하기 함수
  function average(array) {
	var sum = 0.0;
  
	for (var i = 0; i < array.length; i++)
	  sum += array[i];
  
	return sum / array.length;
  }

*/

/**
 * 5. 키워드 분석결과 전체조회
 *  [GET] /api/keyword/allList
 */
exports.allList = (req, res) => {
/*
	// refuse if not an admin
	if(!req.decoded.admin) {
		return res.status(403).json({
			message: 'you are not an admin'
		})
	}
*/

/*
	modelUser.find({}).then(
		users=> {
			//res.json({users})
			res.json({
				success: true,
				data: users
			});
		}
	)
*/

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

	modelKeyword2.countDocuments({ start_date : { $gte: '20160909', $lte: '20160909' }/*, rest_send_key: '291308128611581663'*/ }, function(err, totalCount) {
		// db에서 날짜순으로 데이터들을 가져옴
		if(err) throw err;

		limitSize = totalCount;

		// 페이지 개수
		pageTotalCnt = Math.ceil(totalCount/limitSize);

		modelKeyword2.find({ start_date : { $gte: '20160909', $lte: '20160909' }/*, rest_send_key: '291308128611581663'*/ }) // 조회조건
			.sort({start_date:-1}) // 정렬 조건
			//.skip(skipSize) // skip 건수
			//.limit(limitSize) // 조회건수
			.exec(function(err, result) {
				if(err) throw err;
				/*res.json({
					success: true,
					data: result
				});*/

				res.json(
					res_builder.select( result, pageNum, pageTotalCnt, limitSize, totalCount )
				);
			});
	});
};