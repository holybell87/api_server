/**
 * 응답 JSON 구조 생성
 */
module.exports = {
	// 성공
	success: (msg) => {
		return {
			code: 200,
			detail: msg
		}
	},

	// 데이터 조회
	select: (data, pageNum, pageTotalCnt, limit, rawTotalCnt) => {
		let value = '';
		if(data) {
			value = data;
		} else {
			value = null;
		}

		return {
			code: 200,
			limit: limit,					// 조회할 건수
			pageNum: pageNum,				// 현재 페이지 번호
			pageTotalCnt: pageTotalCnt,		// 페이지 총 개수
			rawTotalCnt: rawTotalCnt,		// 데이터 총 건수
			rawCurrentCnt: value.length,	// 조회된 건수
			result: value
		}
	},

	// jqGrid 데이터 조회
	selectForjqGrid: (data, pageNum, pageTotalCnt, rawTotalCnt) => {
		if(data) {
			return {
				rows: data,
				page: pageNum,			// 현재 페이지 번호
				total: pageTotalCnt,	// 페이지 총 개수
				records: rawTotalCnt	// 데이터 총 건수
			}
		} else {
			return {
				rows: [],
				message: "Data does not exist."
			}
		}
	},

	// 에러
	error: (err) => {
		return {
			error: err
		}
	}
};