/**
 * 소켓 통신 정의
 * 
 * @param server
 */
var socketio = require("socket.io"); // npm install socket.io

exports.setSocketListen = function(server) {
    // 소켓 통신 준비
    const io = socketio.listen(server);
    console.log('socket.io is listening...');

    var userList = []; // 유저목록(닉네임)
    var idList = []; // 유저별 아이디 목록

    //var room_index = 0;
    var room_name = ''; // 채팅방 이름

    // io는 socket.io 패키지 import 변수, socket은 커넥션이 성공시 커넥션 정보
    io.on('connection', function(socket) {
        var addedUser = false; // 클라이언트와 연결이 완료시

        // chat message (메시지 전송) ----------------
        socket.on('chat message', function(data) {
            //io.emit('chat message', {
            io.to(data.roomname).emit('chat message', { // 그룹 전체에게 메시지 전달
                username: socket.username,
                message: data.msg
            });

            console.log('msg: ['+socket.username+'] '+data.msg);
        });
        // ./chat message (메시지 전송) ----------------

        // disconnect (유저 퇴장) ----------------
        socket.on('disconnect', function() {
            if(!addedUser) return;
    
            var index = userList.indexOf(socket.username);
            userList.splice(index,1);

            // 나를 제외한 다른 클라이언트들에게 이벤트 보내기
            socket.broadcast.emit('user disconnect', {
                username: socket.username,
                userlist: userList
            });
        });// ++ 퇴장시 유저목록에서 삭제시켜야함
        // ./disconnect (유저 퇴장) ----------------

        // create room (채팅방 생성) ----------------
        socket.on('create room',function(username) {
            //room_name = 'room' + room_index;
            room_name = 'room' + userList.length % 3;
            console.log(room_name + ' 채팅방이 생성 되었습니다.');

            //console.log('userList.length % 3: '+userList.length % 3);
            /*if(userList.length >= 2) {
                room_index ++;
            }*/

            socket.emit('create room', {
                username: username,
                userlist: userList,
                room: room_name
            });
        });
        // ./create room (채팅방 생성) ----------------

        // add user (유저 입장) ----------------
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
            msg +=  "/c nickname --- change your name to nickname";
            msg += "<br>/w reciever msg --- send your msg to reciever";
            msg += "<br>/q --- exit this chat room";
    
            io.to(idList[username]).emit('chat message', {
                username: from,
                message: msg
            })

            socket.join(room_name); // 그룹에 들어가기
            //console.log(io.adapter.rooms);
            //console.log(socket.adapter.rooms);
            console.log(username + '유저가 ' + room_name +' 채팅방에 접속하였습니다.');
    
            //socket.broadcast.emit('user joined', {
            socket.broadcast.to(room_name).emit('user joined', {
                username: socket.username,
                userlist: userList
            }); //신규자가 왔을때 신규자 페이지를 위한 부분
    
            socket.emit('new people', {
                username: socket.username,
                userlist: userList
            }); //신규자가 왔을때 기존의 페이지들을 위한 부분
        });// 새로 user입장시 처리하는 부분
        // ++ 유저 입장시 오른쪽 부분에 목록에 추가되어야 합니다.
        // ./add user (유저 입장) ----------------

        // whisper (귓속말) ----------------
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
        // ./whisper (귓속말) ----------------

        // change nickname (닉네임 변경) ----------------
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
        // ./change nickname (닉네임 변경) ----------------

        // typing (메시지 입력 중) ----------------
        //socket.on("typing", (username) => {
        socket.on("typing", (data) => {
            //socket.broadcast.emit("typing", username);
            socket.broadcast.to(data.roomname).emit('typing', data.username); // 나를 제외한 그룹 전체
            //console.log(username+" is typing");
        })
        // ./typing (메시지 입력 중) ----------------

        // stop typing (메시지 입력 종료) ----------------
        //socket.on("stop typing", () => {
        socket.on("stop typing", (data) => {
            //socket.broadcast.emit("stop typing");
            socket.broadcast.to(data.roomname).emit('stop typing'); // 나를 제외한 그룹 전체
            //console.log("stop typing");
        })
        // ./stop typing (메시지 입력 종료) ----------------

        //io.sockets.clients('roon name');

        socket.on('user logout', function(roomname) {
            if(!addedUser) return;
    
            var index = userList.indexOf(socket.username);
            userList.splice(index,1);

            // 나를 제외한 다른 클라이언트들에게 이벤트 보내기
            //socket.broadcast.emit('user logout', {
            socket.broadcast.to(roomname).emit('user logout', {
                username: socket.username,
                userlist: userList
            });

            socket.leave(roomname);
        });// ++ 퇴장시 유저목록에서 삭제시켜야함
    });
};



