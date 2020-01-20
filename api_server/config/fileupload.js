/**
 * 파일 업로드 설정
 */

// DEPENDENCIES
const fs = require('fs'); // npm install --save fs
const log4 = require('./log4');
const multer = require('multer'); // npm install --save multer
const path = require('path');
const settings = require('./settings');
const uuid = require('node-uuid'); // npm install --save node-uuid

const logger = log4.getLogger('fileupload');

exports.getFileUpload = function() {
	/*
	 * Generate a v1 (time-based) id
	 * uuid.v1(); // -> '6c84fb90-12c4-11e1-840d-7b25c5ee775a'
	 *
	 * Generate a v4 (random) id
	 * uuid.v4(); // -> '110ec58a-a0f2-4ac4-8393-c866d813b8d1'
	 */
	let i = 0;												// 첨부파일명 구분용 숫자 : 첨부파일이 여러개일 때 첨부파일명을 각각 구분하기 위한 용도로 사용
	const maxFileCount = settings.file_upload_max_count;	// 첨부파일 허용 갯수 
	const maxFileSize = settings.file_upload_max_size;		// 첨부파일 사이즈 (단위:MB)
	//const filePath = settings.file_upload_path;			// 파일이 저장될 경로 (해당 경로에 폴더가 없으면 오류 발생)
	const filePath = path.join(process.cwd(), settings.file_upload_path); // 파일이 저장될 경로 (해당 경로에 폴더가 없으면 오류 발생)

	const storage = multer.diskStorage({
		/* ===================================
			파일저장 경로(목적지) 설정
		==================================== */
		destination : function(request, file, callback) {
			// 1. 디렉토리 유무 확인
			fs.exists(filePath, (exists) => {
				//console.log(exists ? 'it\'s there' : 'no passwd!');
				if(exists) {
					// 2. 디렉토리 있을 시 디렉토리 경로 callback
					callback(null, filePath); // 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
				} else {
					// 3. 디렉토리 없을 시 디렉토리 생성 후 디렉토리 경로 callback
					fs.mkdir(filePath, function(err) {
						if(err) {
							//console.log(err.stack)
							return callback(new Error(err.stack));
						} else {
							callback(null, filePath); // 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
						}
					})
				}
			});
		},

		/* ===================================
			전송된 파일 이름 설정
		==================================== */
		filename : function(request, file, callback) {
			//console.log('##### Request File Upload #####');
			//console.log(file);

			const originalname = file.originalname;						// 원본 파일명
			const splitFilename = originalname.split(".");
			const extension = splitFilename[splitFilename.length-1];		// 파일 확장자
			//const savedFilename = splitFilename[0]+'['+ i + ']_'+Date.now();
			const newFilename = uuid.v1()+'['+ i + ']';					// 저장 될 파일명 (확장자 제외)
			const savedFilename = newFilename + '.' + extension;			// 저장 될 파일명 (학장자 포함)

			i++; // 첨부파일이 2개면, fileName1-시간, fileName2-시간과 같이 번호가 붙는다.	
			//callback(null, file.fieldname + i  + '-' + Date.now()); // file.fieldname = 'file' 타입태그의 field 명이다.
			callback(null, savedFilename);

			// i 값을 초기화 시키지 않으면 계속해서 증가하므로 아래와 같은 초기화 로직을 추가한다.
			if(maxFileCount == i) { // 첨부파일명 구분용 숫자(=i) 가 maxFileCount에 도달하면 
				i = 0; // 0으로 초기화( 다른 함수에서는 초기화가 않되서 이곳에 설정함!)
			}
		}
	});

	/* ===================================
		파일 확장자 필터 설정
	==================================== */
	const fileFilter = function(req, file, callback) {
		const typeArray = file.mimetype.split('/');
		const fileType = typeArray[1].toLowerCase();

		/*
		if(fileType == 'jpg' || fileType == 'png' || fileType == 'jpeg' || fileType == 'gif') {
			callback(null, true);
		} else {
			return callback(new Error('Only images(jpg, jpeg, png, gif) are allowed'));
			//callback(null, false);
		}
		*/

		//if (['png','jpg','jpeg','gif'].indexOf(fileType) >= 0) {
		if(settings.file_upload_check_ext.indexOf(fileType.toLowerCase()) >= 0) {
			//console.log("Found");
			callback(null, true);
		} else {
			//console.log("Not found");
			//return callback(new Error('Only images(jpg, jpeg, png, gif) are allowed'));
			return callback(new Error('허용되지 않은 파일입니다.'));
			//callback(null, false);
		}
	};
 
	const upload = multer({
		storage : storage,					// Where to store the files
		fileFilter : fileFilter,			// Function to control which files are accepted
		limits: {
			fileSize: maxFileSize			// Limits of the uploaded data
		}
	}).array('fileName', maxFileCount);	// fileName : 'file' 타입태그의 field 명

	return upload;
};