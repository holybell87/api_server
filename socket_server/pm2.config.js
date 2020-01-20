/**
 * pm2 process file
 * 
 * http://pm2.keymetrics.io/docs/usage/application-declaration/
 * 
 * 
 * https://blog.rhostem.com/posts/2018-05-27-pm2-deploy
 * 1. 프로세스 실행 : pm2 start pm2.config.js
 *                  (pm2 restart pm2.config.js)
 * 
 * 앱 재시작에는 restart 대신 reload를 사용하는 편이 낫다.
 * 전자는 프로세스를 즉시 종료시키고 재시작하기에 접속이 불가능한 시간이 발생할 수 있다.
 * 하지만 후자는 그런 간격이 생기지 않도록 해준다.
 * reload 명령어는 앱 프로세스와 관련된 프로세스를 정리한 후 준비된 상태에서 다시 시작하는  gracefulReload에 해당된다.
 * 그리고 reload 명령어를 사용할 때 현재 실행중인 프로세스가 없다면 자동으로 start 명령어로 대체한다.
 * 
 * 
 * https://github.com/keymetrics/pm2-logrotate
 * 2. pm2-logrotate 설정 (pm2 set pm2-logrotate:<param> <value>)
 *   // 7일치만 보관
 *   pm2 set pm2-logrotate:retain 7
 *   pm2 set pm2-logrotate:max_size 1M
 *   // gz파일로 압축
 *   pm2 set pm2-logrotate:compress true
 *   // 파일명 포맷
 *   pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
 *   // 5분마다 실행
 *   pm2 set pm2-logrotate:rotateInterval '0 0/5 * * *'
 */

module.exports = {
  apps : [{
    /**
     * [앱 설정]
     * 
     * apps : 앱 설정 영역이다.
     * name : 앱의 이름을 할당한다.
     * script : 앱을 실행할 수 있는 소스 파일의 경로를 할당한다.
     * instances : script로 실행하는 앱이 몇개의 인스턴스를 생성할 것인지를 결정한다. 특히 이 옵션은  exec_mode 옵션이 cluster일때만 의미가 있다.
     * exec_mode : 실행 모드로 fork, cluster를 선택할 수 있다. 이는 PM2가 Node.js 의 cluster API를 사용할지,  child_process.fork를 사용할지를 결정한다.
     * env : 환경변수. deploy 섹션에서는 여러 개의 배포 환경을 설정할 수 있는데,  env에 할당된 값은 모든 환경에서 공통으로 적용된다. 특정 환경에서만 사용하려면 env_이름에 값을 설정해야 하며, 앱을 시작할 때  --env 이름 옵션을 추가해야 한다.
     */
    name: 'SOCKET_Server', // 앱 이름
    script: 'app.js', // 앱 실행 스크립트

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    //args: 'one two',
    autorestart: true,
    watch: false,
    //exec_mode  : 'cluster', // 실행 모드
    //instances: 3, // 앱 인스턴스의 수
    exec_mode  : 'fork',
    max_memory_restart: '1G',

    env: { // 환경변수. 모든 배포 환경에서 공통으로 사용한다
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    /*env_staging: { // staging 배포 환경에서만 사용할 환경 변수
      API_ROOT: 'http://api.server.name'
    },*/

    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    log_file: './logs_pm2/pm2_combined_outerr.log',
    error_file: './logs_pm2/pm2_error.log',
    out_file: './logs_pm2/pm2_out.log',
    merge_logs: true
  }],

	/**
	 * [배포 설정]
	 * 
	 * deploy : 배포 환경과 관련된 설정 영역이다. 배포 환경은 원하는 만큼 만들 수 있다.
	 * PM2는 서버에 접속해서 지정된 위치에 Git 저장소를 복제한 후 사용자가 지정한 명령어를 사용해 앱을 실행하는 방식을 사용한다. 그래서 서버 접속과 Git 저장소와 관련된 정보가 필요하다.
	 * user : 서버 접속에 사용할 계정이다. 접속에는 SSH를 사용한다.
	 * host : 서버 도메인, 또는 IP에 해당하는 값이다.
	 * ref : 서버에서 clone할 Git 저장소의 브랜치 이름이다. origin/master 처럼 remote 이름과 브랜치 이름을 함께 입력한다.
	 * repo : SSH를 사용해서 Git clone을 가능하게 하려면 PM2에서 제시하는 방법을 사용하거나 서버의 SSH 공개 키가 Git 서비스에 등록되어 있어야 한다. 만약 Github를 사용한다면 https://github.com/settings/keys에서 추가 가능하다.

	 * ssh_options (SSH 접속에 사용할 옵션)
	 * path : Git 저장소를 clone할 서버상의 경로에 해당한다. 웹서버에서 설정한 경로로 지정해준다.
	 */
  // deploy : {
  //   production : {
  //	 user : 'node',
  //	 host : '212.83.163.1',
  //	 ref  : 'origin/master',
  //	 repo : 'git@github.com:repo.git',
  //	 path : '/api_server/production',
  //	 'post-deploy' : 'npm install && pm2 reload pm2.config.js --env production'
  //   }
  // },
  // staging: {
  //   user: 'root', // 접속할 계정. SSH를 사용해서 서버에 접속할 수 있어야 한다.
  //   host: 'appstaging.server.name', // 서버 도메인 또는 IP
  //   ref: 'origin/develop', // 서버에서 clone할 브랜치
  //   repo: 'git@github.com:user/reponame.git', // Git 저장소 URL
  //   ssh_options: 'StrictHostKeyChecking=no', // SSH 접속 옵션.
  //   path: '/home/www/project_root', // 앱을 설치할 폴더 위치
  //   'post-deploy': // PM2가 배포(git clone)한 후 실행할 명령어
  //	 'npm install && npm run build && pm2 reload pm2.config.js'
  // },
};
