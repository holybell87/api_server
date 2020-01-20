/*
----------------------------------------------------------------------
[ROUTE]							[METHOD]	[DESCRIPTION]
----------------------------------------------------------------------
/api/download/exceldownload		GET 		엑셀파일을 다운로드 한다.
----------------------------------------------------------------------
*/

// DEPENDENCIES
const errs = require('../../commons/errs');
const excel4node = require('excel4node'); // npm i excel4node
const log4 = require('../../config/log4');
const moment = require('moment'); //npm install moment --save
const res_builder = require('../../commons/response_builder');

// DEFINE MODEL
const modelUser = require('../../models/user');

const logger = log4.getLogger('_1.excel');

/**
 * 1. 엑셀 다운로드
 *  [GET] /api/download/exceldownload
 *  - 파일 다운로드
 *
 * @param pageNum 현재 페이지 번호
 * @param limit 조회할 건수
 */
exports.exceldownload = (req, res) => {
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

	//modelUser.countDocuments({ }, function(err, totalCount) {
	const generateExcel = (totalCount) => {
		return new Promise((resolve, reject) => {
			if(totalCount < 1) {
				return reject(errs.merge_detail(
					errs.ERR_DATABASE_FAILED_SELECT_MONGO,
					'User info do not exist'
				));
			}

			// 페이지 개수
			pageTotalCnt = Math.ceil(totalCount/limitSize);

			// db에서 날짜순으로 데이터들을 가져옴
			modelUser.find({ }, // 조회조건
				{ '_id': false, 'user_id': true, 'user_name': true, 'authority': true, 'reg_date': true, 'mod_date': true }) // 조회할 field 설정
				.sort({reg_date:-1}) // 정렬 조건
				.skip(skipSize) // skip 건수
				.limit(limitSize) // 조회건수
				.exec(function(err, result) {
					//if(err) throw err;
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

					// 엑셀파일 생성
					const wb = new excel4node.Workbook();
					const ext = 'xlsx';
					//const filename = 'export_' + new Date().toFormat('YYYY-MM-DD HH24:MI:SS') + '.' + ext;
					const filename = 'export_' + moment().format('YYYYMMDDHHmmss') + '.' + ext;
					const sheetName = '사용자 목록';

					setSheet(wb, sheetName, result);
					wb.write(filename, res);

					resolve(filename);
				});
		});
	};

	// respond to the client
	const respond = (filename) => {
		/*res.json({
			code: 200,
			detail: 'downloaded excel file in successfully',
			filename
		});*/

		logger.info('##### downloaded excel File (%s) #####', filename);
	};

	// error occured
	const onError = (error) => {
		res.json(
			res_builder.error( error )
		);
	};

	// Define Promise
	modelUser.countDocuments({ })		// 1. 사용자 count 조회
	.then(generateExcel)				 // 2. 엑셀파일 생성 및 다운로드
	.then(respond)					   // 3. 응답처리
	.catch(onError)					  // 예외처리
};

/**
 * Sheet 설정
 * 
 * @param wb workbook개체
 * @param sheetTitle sheet명
 * @param jsonData DB조회결과 데이터
 */
function setSheet(wb, sheetTitle, jsonData) {
	const sheet = wb.addWorksheet(sheetTitle); // sheet명 설정
	const titleStyle = setStyle(wb, 'title');
	const contentStyle = setStyle(wb, 'contents');
	let col = 1;
	//jsonData = JSON.parse(jsonData);
	//const rowKeys = Object.keys(jsonData[0]);
	const rowKeys = Object.keys(jsonData[0].toObject()); // mongoDB key 항목명 추출

	// 1. 컬럼명 설정
	for(let idx in rowKeys) {
		let width = 10;
		switch(rowKeys[idx]) {
			case 'reg_date' :
			case 'mod_date' :
				width = 16;
				break;
			case 'user_id' :
				width = 12;
				break;
			case 'user_name' :
				width = 16;
				break;
			default:
				width = 10;
				break;
		}

		sheet.column(col).setWidth(width);
		sheet.cell(1, col++).string(rowKeys[idx]).style(titleStyle);
	}
	
	// 2. 데이터 설정
	let row = 2;
	for(let idx in jsonData) {
		//console.log( jsonData[idx]['user_name'] );
		//var col = 1;
		col = 1;
		for(let key in rowKeys) {
			//console.log( 'data ', jsonData[idx][rowKeys[key]] );
			setInputText(sheet, row, col, rowKeys[key], jsonData[idx][rowKeys[key]], contentStyle);
			col++;
		}

		row++;
	}
}
/*
function typeCheck(jsonData) {
	for( var key in jsonData ) {
		if( typeof jsonData[key] === 'object' || typeof jsonData[key] === 'array' ) {
			jsonData[key] = typeCheck( jsonData[key] );
		} else {
			if( /^(0|[1-9][0-9]*)$/.test( jsonData[key] ) ) {
				jsonData[key] = parseInt( jsonData[key] );
			}
		}
	}

	return jsonData;
}
*/

/**
 * 스타일 설정
 * 
 * @param wb workbook개체
 * @param type 구분값
 */
function setStyle(wb, type) {
	const border = {
		top:{ style:'thin' },
		bottom:{ style:'thin' },
		left:{ style:'thin' },
		right:{ style:'thin' }
	};
	let alignment = { horizontal: 'center' };
	let family = 'decorative';
	let fillType = 'none';
	let font = {};
	let fill = {};

	if (type == 'title') {
		font = {
			bold: true,
			size: 10
		};
		alignment = { horizontal: 'center' };
		fill = {
			patternType: 'solid',
			fgColor: '#CFCFCF'
		};
		fillType= 'pattern';
	} else if(type == 'contents') {
		font = {
			size: 9,
			wrapText: true
		};
		alignment = { horizontal: 'left' };
	} else if(type == 'center') {
		font = { size: 9 };
		alignment = { horizontal: 'center' };
	}

	font.family = family;
	fill.type = fillType;

	return wb.createStyle({
		border: border,
		font: font,
		alignment: alignment,
		fill: fill
	});
}

/**
 * 데이터 입력
 * 
 * @param sheet sheet개체
 * @param row Row번호
 * @param col Col번호
 * @param key Key명
 * @param text value값
 * @param style 적용 스타일
 */
function setInputText(sheet, row, col, key, text, style) {
	sheet.cell(row, col).style(style);
	// console.log( row, ' ', col );
	if (!text || text == '' || typeof text == 'undefined' || text == undefined || text == 'undefined') {
		return sheet.cell(row, col).string(' ');
	} else {
		// Date Format 설정
		if(key == 'reg_date' || key == 'mod_date' ) {
			text = moment(text).format('YYYY-MM-DD HH:mm:ss');
		}

		text = text.toString().replace(/[\x00-\x09\x0B-\x1F]/gi, '');
		sheet.cell(row, col).string(text);
	}
}