/**
 * App 구동 방법
 *  - 커맨드창에 pm2 start pm2.config.js 입력
 */

// ENV (npm install --save dotenv)
require('dotenv').config(); // .env파일에서 환경변수 load

// DEPENDENCIES
const bodyParser = require('body-parser'); // npm install body-parser
const cmd = require('node-cmd'); // npm i node-cmd 
const cors = require('cors') // npm install cors
const express = require('express'); // npm install express
const fs = require('fs'); // npm install --save fs
const helmet = require('helmet'); // npm install --save helmet
const log4 = require('./config/log4');
const settings = require('./config/settings');
const utility = require('./commons/utility');

const app = express();

/* ===================================
    SET MIDDLEWARE
==================================== */
// CONFIGURE LOG
const log = require('./config/log');
log(app);

// secure apps by setting various HTTP headers
app.use(helmet());

// CONFIGURE APP TO USE bodyParser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// enable CORS - Cross Origin Resource Sharing
app.use(cors());

/*
app.use(function (req, res, next) {
	// CORS에  x-access-token이 추가되었습니다. jwt로 생성된 토큰은 header의 x-access-token 항목을 통해 전달됩니다.
	// CORS(Cross-Origin Resource Sharing): 한 도메인에서 로드되어 다른 도메인에 있는 리소스와 상호 작용하는 클라이언트 웹 애플리케이션에 대한 방법을 정의
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, x-access-token');
	next();
});
*/

// CONFIGURE Controller
//const router_book = require('./controllers/book')(app, Book);
//const router_user = require('./controllers/user')(app, User);
app.use('/api', require('./controllers'))    // /api


/* ===================================
	Error Handler
==================================== */
app.use(function(req, res, next) {
	//console.log('현재모드 : ' + app.get('env'));

	if(req.url.indexOf('/api/') >= 0) {
		throw new Error(req.url + ' not found'); // 404 에러
	} else {
		next();
	}
});

app.use(function (err, req, res, next){
	//console.log(err);
	const errs = require('./commons/errs');

	res.send(errs.merge_detail(
		errs.ERR_API_NOT_FOUND,
		err.message
	));
});

/* ===================================
	Server - RUN
	 1. mongoDB Connection
	 2. scheduler start
	 3. Run express server
	 4. Close connection before shutdown
==================================== */
const logger = log4.getLogger('app');
/*const server = app.listen(settings.port, function() {
	logger.info("API_server (Express) has started on port " + settings.port);
});
*/

logger.info('##########  Startup Server  ##########');
logger.info('## 설치된 노드버전:', process.version);
logger.info('## 실행 아키텍쳐(x64,x86):', process.arch);
logger.info('## 실행 OS:', process.platform);
logger.info('## 프로세스 ID (id로 종료가능):', process.pid);
logger.info('## 노드의 실행시간:', process.uptime());
logger.info('## 노드의 실행위치:', process.cwd());
//logger.info('노드가 설치된 경로: ',process.exePath);
logger.info('## CPU 사용량:', process.cpuUsage());

/* ===================================
	1. mongoDB Connection
==================================== */
const mongo = require('./config/mongo');
mongo.start();

/* ===================================
	2. scheduler start
	 - API 로그파일 월별 폴더관리 & 삭제
	 - mongoDB 로그파일 월별 폴더관리 & 삭제
==================================== */
const scheduler = require('./config/scheduler');
scheduler.start(__dirname);

/* ===================================
	3. Run express server
==================================== */
app.listen(settings.port, "0.0.0.0", () => { // specify an IPV4 address
	logger.info('API server (Express) has started on port %s', settings.port);
	//console.log(process.argv);

	// 현재 실행한 파일의 이름과 Path
	//console.log('finaname : ' + __filename);
	
	// 현재 실행한 파일의 Path
	//console.log('dirname : ' + __dirname);

	// Promise 실행
	utility.getNodeVersion().then((nodeVersion) => {
		logger.info('node version is '+ nodeVersion);
		return utility.getNpmVersion();
	}).then((npmVersion) => {
		logger.info('npm version is '+ npmVersion);
	}).catch((error) => {
		logger.error(error);
	});

/*
	// Promise 선언
	const checkNodeVersion = function () {
		return new Promise(function (resolve, reject) {
			cmd.get(
				'node -v',
				function(err, data, stderr){
					if(!err) {
						logger.info('node version is '+ data.trim());
						resolve();
					} else {
						//console.log('error', err)
						reject();
					}
				}
			);
		});
	};

	const checkNpmVersion = function () {
		return new Promise(function (resolve, reject) {
			cmd.get(
				'npm -v',
				function(err, data, stderr){
					if(!err) {
						logger.info('npm version is '+ data.trim());
						resolve();
					} else {
						//console.log('error', err)
						reject();
					}
				}
			);
		});
	};

	// Promise 실행
	checkNodeVersion().then(() => {
		return checkNpmVersion();
	}).catch((error) => {
		logger.error(error);
	});
*/
}).on('error', (err) => {
	switch(err.code) {
		case 'EACCES': // permission denied
			logger.error('App requires elevated privileges.');
			process.exit(1);
			break;
		case 'EADDRINUSE': // Address already in use
			logger.error('Port %s is already in use.', settings.port);
			process.exit(1);
			break;
		default:
			throw err;
	}
});

/* ===================================
	4. Close connection before shutdown
==================================== */
process.on('SIGINT', () => {
	const jobs = [];

	jobs.push(new Promise((rs, rj) => {
		// 1. Disconnected to mongoDB server
		mongo.close(() => {
			return rs();
		});

		// 2. Stopped the scheduler
		scheduler.stop(() => {
			return rs();
		});
	}));

	Promise.all(jobs).then(() => {
		logger.info('##########  Shutdown Server  ##########');

		setTimeout(() => {
			process.exit();
		}, 300);

	}).catch((err) => {
		setTimeout(() => {
			process.exit(1);
		}, 300);
	});

});


/* ===================================
	Client
	 - ./public => 리소스 폴더
	 - ./view => 화면 html
==================================== */
// 정적 파일 (Static files) : HTML에서 사용되는 .js 파일, css 파일, image 파일 등...
// 서버에서 정적파일을 다루기 위해선, express.static() 메소드를 사용
app.use(express.static('public')); // 경로명 : public

//파일 다운로드 테스트 페이지
app.get('/filedownloadView', function(req, res){
	fs.readFile('./view/filedownloadView.html', function(error, data) {
	   res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
	   res.end(data);
	});
});

//파일 업로드 테스트 페이지
app.get('/fileuploadView', function(req, res){
	fs.readFile('./view/fileuploadView.html', function(error, data) {
	   res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
	   res.end(data);
	});
});

//모달 테스트 페이지
app.get('/modalView', function(req, res){
	fs.readFile('./view/modalView.html', function(error, data) {
	   res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
	   res.end(data);
	});
});

//테이블 TR 드래그앤드랍 테스트 페이지
app.get('/tableDnDView', function(req, res){
	fs.readFile('./view/tableDnDView.html', function(error, data) {
	   res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
	   res.end(data);
	});
});

//테이블 TR 드래그앤드랍 테스트 페이지 2
app.get('/tableDnDView2', function(req, res){
	fs.readFile('./view/tableDnDView2.html', function(error, data) {
	   res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
	   res.end(data);
	});
});

//테이블 TR 이동 테스트 페이지
app.get('/tableMoveView', function(req, res){
	fs.readFile('./view/tableMoveView.html', function(error, data) {
	   res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
	   res.end(data);
	});
});

//테이블 TR 이동 테스트 페이지 2
app.get('/tableMoveView2', function(req, res){
	fs.readFile('./view/tableMoveView2.html', function(error, data) {
	   res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
	   res.end(data);
	});
});

//키워드 하이라이트 테스트 페이지
app.get('/keywordHighlightView', function(req, res){
	fs.readFile('./view/keywordHighlightView.html', function(error, data) {
	   res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
	   res.end(data);
	});
});

//채팅방 테스트 페이지
app.get('/chatView', function(req, res){
	fs.readFile('./view/chatView.html', function(error, data) {
	   res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
	   res.end(data);
	});
});

//키워드분석결과 조회 테스트 페이지
app.get('/keywordListView', function(req, res){
	fs.readFile('./view/keywordListView.html', function(error, data) {
	   res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
	   res.end(data);
	});
});