//[LOAD MODULES]
var express = require('express'); // npm install express
var http = require('http');
var path = require('path'); 
var bodyParser = require('body-parser'); // npm install body-parser
var cors = require('cors') // npm install cors
var static = require('serve-static'); // npm install serve-static
//var fs = require("fs");
//var socketio = require("socket.io");

var app = express();

// 뷰 엔진 설정
app.set('view', __dirname + '/views');
app.set('view engine', 'ejs');
console.log('뷰 엔진이 ejs로 설정되었습니다.');

/*
app.get("/", (req, res) => {
    fs.readFile("./public/index.html", "utf8", (err, buf) => { // 파일불러오기 인코딩 utf8
        res.end(buf); // 읽은 파일정보 내보내기
    })
})
*/


var morgan = require('morgan');
//app.use(morgan('dev'));

app.use(morgan((tokens, req, res) => {
	const moment = require('moment'); //npm install moment --save

	const logFormat = {
		date: moment(new Date()).format('YYYY.MM.DD HH:mm:ss'),
		method: tokens.method(req, res),
		url: tokens.url(req, res),
		status_code: res.statusCode,
		status_message: res.statusMessage,
		//response_time: tokens['response-time'](req, res),
		remote_addr: req.headers.host, // 서버 IP
		user_ip: getClientIpAddress(req), // 사용자 IP
		//entered_data: {}
	};

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
		//_.assign(logFormat.entered_data, req.query, req.body);

		console.log('[ Request ]\r\n%o', logFormat);
	}
}));

function getClientIpAddress(req) {
	let ip = req.headers['x-forwarded-for'] || 
			 req.connection.remoteAddress || 
			 req.socket.remoteAddress ||
			 (req.connection.socket ? req.connection.socket.remoteAddress : null);

	if(ip.length < 15) {
		ip = ip;
	} else {
		ip = ip.slice(7);
	}

	return ip;
};


// 서버 변수 설정 및 static으로 public 폴더 설정
//console.log('config.server_port : %d', config.server_port);
app.set('port', process.env.PORT || 3000);

// body-parser를 이용해 application/x-www-urlencoded 파싱
app.use(bodyParser.urlencoded({extended: false}));

// body-parser를 이용해 application/json 파싱
app.use(bodyParser.json());

// public 폴더를 static으로 오픈
app.use('/public', static(path.join(__dirname, 'public')));

// 클라이언트에서 ajax로 요청 시 cors(다중 서버 접속) 지원
app.use(cors());

app.on('close', function()  {
	console.log('Express 서버 객체가 종료됩니다.');
});

var server = http.createServer(app).listen(app.get('port'), "0.0.0.0", function() {
	console.log("Socket server (Express) has started on port " + app.get('port'));
});

// 소켓 통신 시작
const socket = require('./socket/socket.io_server');
socket.setSocketListen(server);

// express route to ping server.
app.get('/ping', function(req, res) {
	res.send('pong');
});