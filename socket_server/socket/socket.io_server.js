// DEPENDENCIES
const socketio = require("socket.io"); // npm install socket.io
const mongoose = require('mongoose'); // npm install mongoose --save
//const redis = require('redis')

/* ===================================
	MongoDB 설정
==================================== */
// 1. MongoDB 접속
mongoose.connect('mongodb://10.62.130.52/ucess', { useNewUrlParser: true });
//mongoose.connect('mongodb://127.0.0.1/test', { useNewUrlParser: true });

// 2. 모델 정의 (Schema 명칭)
const Schema = mongoose.Schema, ObjectId = Schema.ObjectId;
const chatLogsSchema = new Schema({
	id: ObjectId,
	log: String,
	date: String
}, {
	// __v 제거 (versionKey)
	versionKey: false // You should be aware of the outcome after set to false
});

// 3. 컬렉션 생성
const ChatLogsModel = mongoose.model('tbl_chat_logs', chatLogsSchema);


 /* ===================================
	소켓 통신 정의
	  - io는 socket.io 패키지를 import한 변수
	  - socket은 커넥션이 성공했을 때 커넥션에 대한 정보를 담고 있는 변수
==================================== */
exports.setSocketListen = function(server) {
	// 채팅방 참여 유저
	let users = []; // 사용자ID 목록
	let socketIds = []; // 사용자ID별 socket.id 목록

	// REDIS (발행자, 구독자)
	//var subscriber = redis.createClient(6379, '10.62.130.52');
	//var publisher = redis.createClient();

	 // 소켓 통신 준비
    const io = socketio.listen(server);
    console.log('socket.io is listening...');

	//io.on('connection', function(socket) {
	io.sockets.on('connection', function (socket) {
		// 1. 최초 접속시 호출
		socket.on('chat_user', function (raw_msg) {
			var msg = JSON.parse(raw_msg);
			var channel = '';
			if(msg["channel"] != undefined) {
				channel = msg["channel"];
			}

			console.log('----- chat_user -----');
			console.log(msg);

			socket.emit('socket_evt_chat_user', JSON.stringify(users));
			var chatLog = mongoose.model('tbl_chat_logs', chatLogsSchema);
			chatLog.find({}, function (err, logs) {
				socket.emit('socket_evt_logs', JSON.stringify(logs));
				socket.broadcast.emit('socket_evt_logs', JSON.stringify(logs)); // 나를 제외한 전체
			});
		});

		// 2. 사용자가 접속했을 때의 상황 처리
		socket.on('chat_conn', function (raw_msg) {
			var msg = JSON.parse(raw_msg);

			socketIds[msg.chat_id] = socket.id;
			console.log('----- chat_conn -----');
			console.log(msg);

			var channel = '';
			if(msg['channel'] != undefined) {
				channel = msg['channel'];
			}
			//socket.set('workspace', msg.workspace);
			//socket.join('some room'); // 특정채팅방 JOIN
			//socket.leave('some room'); // 특정채팅방 OUT

			var index = users.indexOf(msg.chat_id);
			if (index != -1) {
				socket.emit('chat_fail', JSON.stringify(msg.chat_id));
			} else {
				users.push(msg.chat_id);
				socket.broadcast.emit('chat_join', JSON.stringify(users)); // 나를 제외한 전체
				socket.emit('chat_join', JSON.stringify(users));

				var chatLog = new ChatLogsModel();
				chatLog.log = msg.chat_id + '님이 접속하셨습니다.';
				chatLog.date = getToday();
				chatLog.save(function (err) {
					if (err)
						return handleError(err);
					var chatLog_ = mongoose.model('tbl_chat_logs', chatLogsSchema);
					chatLog_.find({}, function (err, logs) {
						socket.emit("socket_evt_logs", JSON.stringify(logs));
						socket.broadcast.emit("socket_evt_logs", JSON.stringify(logs)); // 나를 제외한 전체
					});
				});
			}
		});

		// 3. 사용자가 메시지를 보냈을 때의 상황 처리
		socket.on('message', function (raw_msg) {
			var msg = JSON.parse(raw_msg);
			var channel = '';
			if(msg['channel'] != undefined) {
				channel = msg['channel'];
			}

			console.log('----- message -----');
			console.log(msg);

			if (channel == 'chat') {
				var chatting_message = msg.chat_id + ' : ' + msg.message;
				//publisher.publish('chat', chatting_message);

				//io.to(channel).emit('message_go', chatting_message); // 수정
				socket.emit('message_go', ('(전체) ' + chatting_message)); // 수정
				//socket.broadcast.to('some room').emit('message_go', chatting_message); // 특정 채팅방에 있는 모든 사람에게 전달
				socket.broadcast.emit('message_go', ('(전체) ' + chatting_message)); // 나를 제외한 전체
			}
		});

		// 4. 사용자가 채팅방을 나갔을 때의 상황 처리
		socket.on('leave', function (raw_msg) {
			var msg = JSON.parse(raw_msg);
			console.log('----- leave -----');
			console.log(msg);

			if (msg.chat_id != '' && msg.chat_id != undefined) {
				var index = users.indexOf(msg.chat_id);
				socket.emit('someone_leaved', JSON.stringify(msg.chat_id));
				socket.broadcast.emit('someone_leaved', JSON.stringify(msg.chat_id)); // 나를 제외한 전체
				users.splice(index, 1); // index번 배열부터 1개 제거

				var chatLog = new ChatLogsModel();
				chatLog.log = msg.chat_id + '님이 나가셨습니다.';
				chatLog.date = getToday();
				chatLog.save(function (err) {
					if (err)
						return handleError(err);
					var chatLog_ = mongoose.model('tbl_chat_logs', chatLogsSchema);
					chatLog_.find({}, function (err, logs) {
						socket.emit('socket_evt_logs', JSON.stringify(logs));
						socket.broadcast.emit('socket_evt_logs', JSON.stringify(logs)); // 나를 제외한 전체
					});
				});
			}

			socket.emit('refresh_userlist', JSON.stringify(users));
			socket.broadcast.emit('refresh_userlist', JSON.stringify(users)); // 나를 제외한 전체
		});

		// 5. 사용자가 대화 입력 중일때의 상황 처리
		socket.on("typing", (raw_msg) => {
			var msg = JSON.parse(raw_msg);
			socket.broadcast.emit("typing", msg.chat_id); // 나를 제외한 전체
			//socket.broadcast.to('some room').emit('typing', raw_msg.username); // 나를 제외한 그룹 전체
		});

		// 6. 사용자가 대화 입력을 완료했을 때의 상황 처리
		socket.on("stop typing", (raw_msg) => {
			socket.broadcast.emit("stop typing"); // 나를 제외한 전체
			//socket.broadcast.to('some room').emit('stop typing'); // 나를 제외한 그룹 전체
		});

		// 7. 사용자의 연결이 끊어졌을 때의 상황 처리
		socket.on('disconnect', () => {
			const host = socket.handshake.headers.host;
			//console.log('disconnected from ', socket.id);
			console.log('disconnected from ', host);
		});

		// 8. 특정 사용자에게 귓속말 처리
		socket.on('whisper', function(raw_msg) {
			var msg = JSON.parse(raw_msg);
			var channel = '';
			if(msg['channel'] != undefined) {
				channel = msg['channel'];
			}

			console.log('----- whisper -----');
			console.log(msg);

			if (channel == 'chat') {
				var message = msg.message;
				var from_id = msg.from_id; // 보내는 사람
				var to_id = msg.to_id; // 받는 사람

				const for_sender_socket_id = socketIds[from_id];
				const for_reciever_socket_id = socketIds[to_id];

				io.to(for_sender_socket_id).emit('message_go', ('(귓속말) ' + to_id + ' : ' + message));
				io.to(for_reciever_socket_id).emit('message_go', ('(귓속말) ' + from_id + ' : ' + message));
			}
		});


		//구독자 객체가 메시지를 받으면 소켓을 통해 메시지를 전달
		//subscriber.on('message', function (channel, message) {
		//	socket.emit('message_go', message);
		//});

		
		//구독자 객체는 'chat'을 구독 시작
		//subscriber.subscribe('chat');
	}); 

	// SOCKET 연결 끊어질 시 호출
	//io.sockets.on('close', function (socket) {
	io.on('close', function (socket) {
		console.log('----- close -----');
		//subscriber.unsubscribe();
		//publisher.close();
		//subscriber.close();
	});

};

// 현재 시간 얻기
function getToday() {
	//var date = new Date();
	//return date.getFullYear() +'.'+ (date.getMonth()+1) +'.'+ date.getDate() +' '+ date.getHours() +':'+ date.getMinutes() +':'+date.getSeconds();

	const moment = require('moment'); //npm install moment --save
	const date = moment(new Date()).format('YYYY.MM.DD HH:mm:ss');
	return date;
}