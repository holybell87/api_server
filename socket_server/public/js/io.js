/**
* Client socket 연동
*
*/

var socket = io();
var ul = document.querySelector("#chat_box");
var num = Math.floor(Math.random() * 20); // 구분자
document.writeln('user name is user'+num); // 구분자 해당 document 에 출력


// 소켓연결
socket.on('connect', function() {
    console.log('socket.io Server has connected!!');
});


// 서버에서 받은 값 li 로 추가 시키기
socket.on('server', function (msg) {
    //var li = document.createElement("li"); // li태그 생성
    //li.innerText = msg;

	msg = msg.split('||');
	var userId = msg[0];
	var userMsg = msg[1];

    var div = document.createElement("div"); // li태그 생성
	var value = '';
/*
	// You
    value += "<li class='left clearfix'>";
    value += "    <span class='chat-img pull-left'>";
    value += "        <img src='http://placehold.it/50/55C1E7/fff&text=U' alt='User Avatar' class='img-circle' />";
    value += "    </span>";
    value += "    <div class='chat-body clearfix'>";
    value += "        <div class='header'>";
    value += "            <strong class='primary-font'>" + userId + "</strong> <small class='pull-right text-muted'>";
    value += "                <span class='glyphicon glyphicon-time'></span>12 mins ago</small>";
    value += "        </div>";
    value += "        <p>";
    value +=          userMsg
    value += "        </p>";
    value += "    </div>";
    value += "</li>";
*/
	// Me
    value += "<li class='right clearfix'>";
    value += "    <span class='chat-img pull-right'>";
    value += "        <img src='http://placehold.it/50/FA6F57/fff&text=ME' alt='User Avatar' class='img-circle' />";
    value += "    </span>";
    value += "    <div class='chat-body clearfix'>";
    value += "        <div class='header'>";
    value += "            <small class='text-muted'><span class='glyphicon glyphicon-time'></span>13 mins ago</small>";
    value += "                <strong class='pull-right primary-font'>" + userId + "</strong>";
    value += "        </div>";
    value += "        <p>";
    value +=          userMsg
    value += "        </p>";
    value += "    </div>";
    value += "</li>";

	div.innerHTML = value;

    //ul.appendChild(li);
    ul.appendChild(div);
})


function chat_input (e) {
    if ( e.keyCode == 13 ) { // enter
//        socket.emit("client", e.target.value);
        socket.emit("client", "user"+num+"||"+e.target.value); // 구분자+입력값 소켓 서버로 전송

        // 입력값 초기화
        e.target.value = "";
        e.preventDefault();
    }
}

$('#btn-chat').bind('click', function(event) {
	//println('connectionBtn 클릭함.');

	//host = $('#hostInput').val();
	//port = $('#portInput').val();

	 socket.emit("client", "user"+num+"||"+$('#btn-input').val()); // 구분자+입력값 소켓 서버로 전송
	 $('#btn-input').val('')
});



socket.on("play join", function (msg) {
    msg = "[알림]&nbsp;" + msg;
    var li = document.createElement("li");
    li.innerHTML = msg;
    ul.appendChild(li);
});



//var input = document.querySelector("#btn-input");
var input = document.querySelector("#btn-input");
//var typing_notice = document.querySelector("#notice");
var limit = 400; // ms 

//input.on("input", function () {
$( "#btn-input" ).on("input", function () {
     socket.emit("typing") // 서버로 전달
     var lastTyping = new Date().getTime();
     
     // 나중에 Lodash 모듈로 대체하길 바랍니다. 
     setTimeout(function () {
          var nowTime = new Date().getTime();
          var diffTime =  nowTime - lastTyping;
          if (diffTime >= limit) {
               console.log("stop typing...");
               socket.emit("stop typing"); // 서버로 전달
          }
     }, limit )  //  타이핑이 끝난 뒤 400 밀리세컨드 
    
})

// 서버에서 받는 typing 이벤트
socket.on("typing", function () {
     //typing_notice.innerText = "누군가 is typing...";
	 console.log("누군가 is typing...");
})

// 서버에서 받는 stop typing 이벤트
socket.on("stop typing", function () {
     //typing_notice.innerText = "";
	  console.log("stop typing...");
})