// DEPENDENCIES
const ip_addr = require('../commons/ip_address');
const log4 = require('./log4');
const moment = require('moment'); //npm install moment --save
const morgan = require('morgan'); // npm i morgan
//const morgan_body = require('morgan-body'); // npm i morgan-body
const _ = require('lodash'); // npm i --save lodash

const logger = log4.getLogger('log');

/**
 * 기본로그 출력
 *
 * @param app
 */
module.exports = (app) => {
/*
	const options = {
		skip: function (req, res) {
				//delete req.headers.accessToken;
				//delete req.headers.refreshToken;
				delete req.query.user_password;
				delete req.body.user_password;
		},
		theme: 'defaultTheme',
		dateTimeFormat: 'clf',
		logRequestBody: true,
		logResponseBody: true,
		prettify: true
	};	

	// 1. 정상로그 출력
	morgan_body(app, options);
*/
	app.use(morgan((tokens, req, res) => {
		const logFormat = {
			//date: new Date().toFormat('YYYY-MM-DD HH24:MI:SS'),
			date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
			method: tokens.method(req, res),
			url: tokens.url(req, res),
			status_code: res.statusCode,
			status_message: res.statusMessage,
			//response_time: tokens['response-time'](req, res),
			remote_addr: req.headers.host, // 서버 IP
			user_ip: ip_addr.getClientIpAddress(req), // 사용자 IP
			entered_data: {}
		};

		// 2. 불필요 데이터 제거
		delete req.headers.accessToken;
		delete req.headers.refreshToken;
		delete req.query.user_password;
		delete req.body.user_password;

		const ext = logFormat.url.split('.').pop().toLowerCase();
		//if($.inArray(ext, ['css','js','gif','png','jpg','jpeg']) == -1) {
			//alert('gif,png,jpg,jpeg 파일만 업로드 할수 있습니다.');
			//return;
		//}

		// 불필요한 url은 로그 표시하지 않도록...
		if (['css','js','gif','png','jpg','jpeg','ico'].indexOf(ext) >= 0) {
			//console.log("Found");
		} else {
			//console.log("Not found");

			// 3. 입력데이터 병합
			_.assign(logFormat.entered_data, req.query, req.body);

			logger.info('[ Request ]\r\n%o', logFormat);
		}
	}));
};