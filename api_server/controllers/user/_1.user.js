/*
----------------------------------------------------------------------
[ROUTE]							[METHOD]	[DESCRIPTION]
----------------------------------------------------------------------
/api/user/list					GET			등록되어 있는 모든 유저정보를 조회한다.
/api/user/fileupload			POST		파일을 업로드 한다.
/api/user/filedownload			GET 		파일을 다운로드 한다.
/api/user/filelist				GET			파일목록을 조회한다.
----------------------------------------------------------------------
*/

// DEPENDENCIES
const errs = require('../../commons/errs');
const fileuploadModule = require('../../config/fileupload');
const filedownloadModule = require('../../config/filedownload');
const fs = require('fs'); // npm install --save fs
const log4 = require('../../config/log4');
//const mime = require('mime'); // npm install mime
const res_builder = require('../../commons/response_builder');

// DEFINE MODEL
const modelFile = require('../../models/file');
const modelUser = require('../../models/user');

//require('date-utils'); // npm install date-utils

const logger = log4.getLogger('_1.user');
const upload = fileuploadModule.getFileUpload();



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
 * 1. 사용자 조회
 *  [GET] /api/user/list
 *  - 사용자 조회
 *
 * @param pageNum 현재 페이지 번호
 * @param limit 조회할 건수
 */
exports.list = (req, res) => {
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

	modelUser.countDocuments({ }, function(err, totalCount) {
		// db에서 날짜순으로 데이터들을 가져옴
		if(err) throw err;

		// 페이지 개수
		pageTotalCnt = Math.ceil(totalCount/limitSize);

		modelUser.find({ }) // 조회조건
			.sort({reg_date:-1}) // 정렬 조건
			.skip(skipSize) // skip 건수
			.limit(limitSize) // 조회건수
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

/**
 * 2. 사용자 파일 업로드
 *  [POST] /api/user/fileupload
 *  - 파일 업로드 + 업로드 내역 저장
 *
 * @param user_id 사용자 ID
 * @body fileName 파일객체
 */
exports.fileupload = (req, res) => {
	// request data
	const user_id = req.query.user_id;

	const readyFileupload = () => {
		return new Promise((resolve, reject) => {
			// 1.파일 업로드
			upload(req, res, function(err) { //<-- 이 순간 파일이 올라간다.
				/*
				[ { fieldname: 'fileName',
					originalname: '20160120101937_801179_540_933.jpg',
					encoding: '7bit',
					mimetype: 'image/jpeg',
					destination: '../fileupload',
					filename: '845d3a40-6830-11e6-91d9-353eae272859[0].jpg',
					path: '..\\fileupload\\845d3a40-6830-11e6-91d9-353eae272859[0].jpg',
					size: 143193 } ]
				*/
				//console.log(req.files);

				const fileInfo = [];
				const files = req.files; // 첨부파일 갯수가 1개든 2개든 모두 array로 인식된다!
				const fileCount = files.length; // 첨부파일 갯수

				for(let i=0 ; i<fileCount; i++) {
					const fileFormat = {
						user_id: user_id,
						originalFileNm: files[i].originalname, // 원본파일명
						savedFileNm: files[i].filename, // 저장된 파일명
						mimetype: files[i].mimetype, // 파일타입
						destination: files[i].destination, // 저장된 경로
						//fileSize: Number(files[i].size/1024).toFixed(2) + ' KB',
						fileSize: files[i].size, // 파일사이즈 (단위: 바이트)
						date: new Date()
					};

					fileInfo.push(fileFormat);
				}

				logger.info('##### Response File Upload #####\r\n%o', fileInfo);

				if(err) {
					// 에러로그 DB저장
					log4.saveError(req, res, errs.merge_detail(
						errs.ERR_FILE_UPLOAD,
						err.message
					));

					//return reject(err);
					return reject(errs.merge_detail(
						errs.ERR_FILE_UPLOAD,
						err.message
					));
				}

				// 2. 업로드 내역 저장
				for(let j=0; j<fileInfo.length; j++) {
					const file = new modelFile(fileInfo[j]);

					// Document instance method
					file.save(function(err) { //insert는 _id가 있어도 같은 동작을 하지만 , save는 중복체크를하여 _id가 있으면 update
						if(err) {
							logger.error(errs.merge_detail(
								errs.ERR_DATABASE_FAILED_INSERT_MONGO,
								err.message
							));

							return reject(errs.merge_detail(
								errs.ERR_DATABASE_FAILED_INSERT_MONGO,
								err.message
							));
						}
					});
				}

				// return file info
				return resolve(fileInfo);
			});
		})
	};

	// respond to the client
	const respond = (fileInfo) => {
		/*
		res.json({
			code: 200,
			detail: 'uploaded files in successfully',
			fileInfo
		});
		*/

		const msg = {
			"msg": 'uploaded files in successfully',
			"fileInfo": fileInfo
		}
		res.json(
			res_builder.success( msg )
		);
	};

	// error occured
	const onError = (error) => {
		res.json(
			res_builder.error( error )
		);
	};

	// Define Promise
	readyFileupload()		  // 1. 파일 업로드 + 업로드 내역 저장
	.then(respond)			 // 2. 응답처리
	.catch(onError)			// 예외처리
};

/**
 * 3. 파일 다운로드
 *  [GET] /api/user/filedownload
 *  - 파일 다운로드
 *
 * @param filename 파일명
 */
exports.filedownload = (req, res) => {
	// request data
	//var fileId = req.params.filename; //fileid = 각각의 파일을 구분하는 파일ID 값
	const filename = req.query.filename;

	//var origFileNm, savedFileNm, savedPath, fileSize; //DB에서 읽어올 정보들

	const filedownload = (fileInfo) => {
		/*
		{ _id: 5ce77d4a4496742bc45180c7,
		originalFileNm: 'wallpaper-2121160.png',
		savedFileNm: '8ede8760-7de2-11e9-bc1a-5bda93f07fed[1].png',
		mimetype: 'image/png',
		destination: '/fileupload',
		fileSize: 13101,
		date: 2019-05-24T05:12:42.457Z,
		__v: 0 }
		*/
		//console.log(fileInfo);

		return new Promise((resolve, reject) => {
			if(!fileInfo) {
				return reject(errs.merge_detail(
					errs.ERR_DATABASE_FAILED_SELECT_MONGO,
					'File info do not exist'
				));
			} else {
				// 파일 다운로드
				//const origFileNm = 'resume.doc';
				//const savedFileNm = 'resume.doc';
				//const savedPath = '../../filedownload/resume';

				//var file = savedPath + '/' + savedFileNm; //예) '/temp/filename.zip'
				const file = fileInfo.destination + '/' + fileInfo.savedFileNm;
				//만약 var file 이 저장경로+원본파일명으로 이루져 있다면, 'filename = path.basename(file)' 문법으로 파일명만 읽어올 수도 있다.

				//mimetype = mime.lookup(file) 와 같이 '저장경로+파일명' 정보를 파라미터로 전달해도 된다. 이때 파일명은 확장자를 포함해야함
				//mimetype = mime.lookup( origFileNm ); // => 'application/zip', 'text/plain', 'image/png' 등을 반환
				//console.log('* mimetype : ' + mimetype);
				const mimetype = fileInfo.mimetype;

				// 파일존재  유무확인
				fs.exists(file, function (exists) {
					//console.log(exists ? "it's there" : "no exists!");

					if(exists) {
						/*
						// 파일 정보
						fs.stat(file, function(err, stats) {
							if(err) throw err;
							console.log('* --------------- File Info ---------------');
							console.log('* size : ', stats.size+'KB');
							console.log('* isFile : ', stats.isFile());
							console.log('* isDirectory : ', stats.isDirectory());
							console.log('* isFIFO : ', stats.isFIFO());
							console.log('* -----------------------------------------');
						});
						*/

						const filedownloadName = filedownloadModule.getDownloadFilename(req, fileInfo.originalFileNm);
						//res.download(file, filedownloadName);
						//res.attachment(filedownloadName);

						res.setHeader('Content-Disposition', 'attachment; filename=' + filedownloadName); // origFileNm으로 로컬PC에 파일 저장
						res.setHeader('Content-Type', mimetype);
						//res.setHeader('Content-Type', 'application/octet-stream');
						//res.setHeader('Content-Type', 'text/plain; charset=utf-8');
						res.setHeader('Content-Length', fileInfo.fileSize);

						//res.setHeader("Content-Transfer-Encoding", "binary;");
						//res.setHeader("Pragma", "no-cache;");
						//res.setHeader("Expires", "-1;");

						var filestream = fs.createReadStream(file);
						filestream.pipe(res);
					} else {
						console.log('The file ('+ file + ') does not exist');

						//res.send("<script type='text/javascript'>alert('서버에 다운로드 할 파일이 존재하지 않습니다.'); history.go(-1);</script>");
						reject(errs.merge_detail(
							errs.ERR_FILE_NOT_EXIST
						));
					}
				});

				//resolve(fileInfo);
			}
		});
	};

	// respond to the client
	/*const respond = (fileInfo) => {
		res.json(
			res_builder.success(fileInfo)
		);
	};*/

	// error occured
	const onError = (error) => {
		/*res.status(403).json({
			message: error.message
		});*/
		res.json(
			res_builder.error( error )
		);
	};

	// Define Promise
	modelFile.findOneByFilename(filename)  // 1. 파일 조회 (findOneByFilename: model에서 정의한 메소드)
	.then(filedownload)				  // 2. 파일 다운로드
	//.then(respond)					 // 3. 응답처리
	.catch(onError)					  // 예외처리
};

/**
 * 4. 파일 목록 조회
 *  [GET] /api/user/filelist
 *  - 사용자 파일 조회
 *
 * @param user_id 사용자 ID
 * @param pageNum 현재 페이지 번호
 * @param limit 조회할 건수
 */
exports.filelist = (req, res) => {
	// request data
	const user_id = req.query.user_id;

	// 현재 페이지 번호
	let pageNum = req.query.pageNum;
	if(pageNum == null) pageNum = 1;
	pageNum = Number(pageNum); // 숫자형으로 치환

	let limitSize = req.query.limit;
	if(limitSize == null) limitSize = 10; // 10개씩 조회 (default)
	limitSize = Number(limitSize); // 숫자형으로 치환

	let skipSize = (pageNum-1)*limitSize;
	let pageTotalCnt = 1;

	modelFile.countDocuments({user_id: user_id}, function(err, totalCount) {
		// db에서 날짜순으로 데이터들을 가져옴
		if(err) throw err;

		// 페이지 개수
		pageTotalCnt = Math.ceil(totalCount/limitSize);

		modelFile.find({user_id: user_id}) // 조회조건
			.sort({reg_date:-1}) // 정렬 조건
			.skip(skipSize) // skip 건수
			.limit(limitSize) // 조회건수
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