/**
 * 한글파일명 디코딩
 * 
 * @param request
 * @param filename 파일명
 * @returns filename 파일명
 */

 // DEPENDENCIES
 const iconv = require('iconv-lite'); // npm i iconv-lite

 exports.getDownloadFilename = function(req, filename) {
	 const header = req.headers['user-agent'];
	 //const strContents = new Buffer(filename);
	 const strContents = Buffer.from(filename) ;
 
	 if (header.includes("MSIE") || header.includes("Trident")) { 
		 return encodeURIComponent(filename).replace(/\\+/gi, "%20");
	 } else if (header.includes("Chrome")) {
		 //return iconv.decode(iconv.encode(filename, "UTF-8"), 'ISO-8859-1');
		 //return iconv.decode(strContents, 'UTF-8').toString();
		 return escape(iconv.decode(strContents, 'UTF-8').toString());
	 } else if (header.includes("Opera")) {
		 //return iconv.decode(iconv.encode(filename, "UTF-8"), 'ISO-8859-1');
		 //return iconv.decode(strContents, 'UTF-8').toString();
		 return escape(iconv.decode(strContents, 'UTF-8').toString());
	 } else if (header.includes("Firefox")) {
		 //return iconv.decode(iconv.encode(filename, "UTF-8"), 'ISO-8859-1');
		 //return iconv.decode(strContents, 'UTF-8').toString();
		 return escape(iconv.decode(strContents, 'UTF-8').toString());
	 }
 
	 return filename;
 }