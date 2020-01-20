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

var server = http.createServer(app).listen(app.get('port'), function() {
	console.log("Express server has started on port " + app.get('port'));
});


const socket = require('./socket/socket.io_server');
socket.setSocketListen(server);

/*
// 소켓 통신 준비
const io = socketio.listen(server);
console.log('socket.io is listening...');

var userList = []; // 유저목록(닉네임)
var idList = []; // 유저별 아이디 목록

// io는 socket.io 패키지 import 변수, socket은 커넥션이 성공시 커넥션 정보
io.on('connection', function(socket) {
	var addedUser = false; // 클라이언트와 연결이 완료시

	// chat message ----------------
	socket.on('chat message', function(msg) {
		io.emit('chat message', {
			username: socket.username,
			message: msg
		});

		console.log('msg: ['+socket.username+'] '+msg);
	});
	// ./chat message ----------------

	// disconnect ----------------
	socket.on('disconnect', function() {
		if(!addedUser) return;
 
		var index = userList.indexOf(socket.username);
		userList.splice(index,1);

		socket.broadcast.emit('user logout', {
			username: socket.username,
			userlist: userList
		});
	});// ++ 퇴장시 유저목록에서 삭제시켜야함
	// ./disconnect ----------------

	// add user ----------------
	socket.on('add user',function(username) {
		if(addedUser) return;
 
		addedUser = true;
		idList[username] = socket.id;
		//console.log(idList); // [ '홍길동': 'UvMw5R7ckV5UXEECAAAC' ]
		socket.username = username;
		userList.push(username);
		//console.log(userList); // ['홍길동']
		var from = "admin";
		//var msg = "<help>    <br>/c nickname --- change your name to nickname<br>/w reciever msg --- send your msg to reciever ";
		var msg = "<help>";
		msg +=  "<br>/c nickname --- change your name to nickname";
		msg += "<br>/w reciever msg --- send your msg to reciever";
		msg += "<br>/q --- exit this chat room";
 
		io.to(idList[username]).emit('chat message', {
			username: from,
			message: msg
		})
 
		socket.broadcast.emit('user joined', {
			username: socket.username,
			userlist: userList
		}); //신규자가 왔을때 신규자 페이지를 위한 부분
 
		socket.emit('new people', {
			username: socket.username,
			userlist: userList
		}); //신규자가 왔을때 기존의 페이지들을 위한 부분
	});// 새로 user입장시 처리하는 부분
	// ++ 유저 입장시 오른쪽 부분에 목록에 추가되어야 합니다.
	// ./add user ----------------

	// whisper ----------------
	socket.on('whisper',function(data) {
		var msg = data.Msg;
		var to = data.To;
		//var after_to = socket.username + '님에게';
		var after_to = to + '님에게';
		var from = socket.username;
		var after_from = socket.username + '님의 귓속말';

		for_reciever_socket_id = idList[to];
		for_sender_socket_id = idList[from];

		io.to(for_sender_socket_id).emit('whisper chat message', {
			username: socket.username,
			username_sub: after_to,
			message: msg
		});

		io.to(for_reciever_socket_id).emit('whisper chat message', {
			username: socket.username,
			username_sub: after_from,
			message: msg
		});
	});
	// ./whisper ----------------

	// change nickname ----------------
	socket.on('change nickname',function(username) {
		var lastname = socket.username;
		socket.username = username;
		index = userList.indexOf(lastname);
		userList[index] = socket.username;

		socket.emit('new nickname', {
			newname: socket.username,
			pastname: lastname,
			userlist: userList
		})
	})
	// ./change nickname ----------------

	// typing ----------------
	socket.on("typing", (username) => {
          socket.broadcast.emit("typing", username);
		   //console.log(username+" is typing");
     })
	// ./typing ----------------

	// stop typing ----------------
     socket.on("stop typing", () => {
          socket.broadcast.emit("stop typing");
		  //console.log("stop typing");
     })
	// ./stop typing ----------------
});
*/

/*
// 클라이언트가 연결했을 때의 이벤트 처리
io.sockets.on('connection', function(socket) {
	//console.log('connection info: ' + JSON.stringify(socket.request.connection._peername));
	console.log("a user Connect");

	// 소켓 객체에 클라이언트 Host, Port 정보 속성으로 추가
	socket.remoteAddress = socket.request.connection._peername.address;
	socket.remotePort = socket.request.connection._peername.port;

    //socket 의 broadcast 는 나를 제외한 모든 사람에게 전체알림을 하는 기능입니다.
    socket.broadcast.emit("play join", "새로운 유저가 입장했습니다."); 

	// client에서 보낸 이벤트 받기 (msg: 구분자+입력값)
    socket.on("client", function (msg) { // client 라는 이벤트 네임으로 메시지 받기
        console.log('msg: '+msg)
        io.emit("server", msg); // 메시지 호출
    })

    socket.on("typing", () => {
          socket.broadcast.emit("typing"); // typing 알리기
     })

     socket.on("stop typing", () => {
          socket.broadcast.emit("stop typing"); // stop 알리기
     })
});
*/