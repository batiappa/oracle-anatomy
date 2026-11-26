/* 실무 메모: 힌트에 나온 명령마다 "옵션을 찾아보는 방법"과 "현장에서 자주 덧붙이는 옵션"을 주석으로 붙인다.
   리눅스 실습실(lab/)과 DBA 실습(dba/)이 함께 쓴다.
   - Tips.html(hint, esc): 힌트 글에서 명령을 찾아 주석 줄(#, --)과 근거 링크를 HTML로 돌려준다.
   - Tips.ref(name): man, --help 에서 보여 줄 실습용 요약(이름, 형식, 주요 옵션)을 돌려준다.
   리눅스 옵션은 Oracle Linux 8의 GNU/procps 도구 기준으로, 가상 터미널에서 실제로 동작하는 것 위주로 적었다.
   오라클 명령의 근거는 Oracle Database 19c 공식 문서다. */
(function () {
  'use strict';
  const D19 = 'https://docs.oracle.com/en/database/oracle/oracle-database/19/';
  const S = {
    help: ['SQL*Plus 19c · HELP', D19 + 'sqpug/HELP.html'],
    spool: ['SQL*Plus 19c · SPOOL', D19 + 'sqpug/SPOOL.html'],
    set: ['SQL*Plus 19c · SET System Variable Summary', D19 + 'sqpug/SET-system-variable-summary.html'],
    show: ['SQL*Plus 19c · SHOW', D19 + 'sqpug/SHOW.html'],
    column: ['SQL*Plus 19c · COLUMN', D19 + 'sqpug/COLUMN.html'],
    startup: ['SQL*Plus 19c · STARTUP', D19 + 'sqpug/STARTUP.html'],
    sqlqr: ['SQL Quick Reference 19c · SQL*Plus Commands', D19 + 'sqlqr/SQL-Plus-Commands.html'],
    altersys: ['SQL Language Reference 19c · ALTER SYSTEM', D19 + 'sqlrf/ALTER-SYSTEM.html'],
    alterdb: ['SQL Language Reference 19c · ALTER DATABASE', D19 + 'sqlrf/ALTER-DATABASE.html'],
    createuser: ['SQL Language Reference 19c · CREATE USER', D19 + 'sqlrf/CREATE-USER.html'],
    grant: ['SQL Language Reference 19c · GRANT', D19 + 'sqlrf/GRANT.html'],
    flashback: ['SQL Language Reference 19c · FLASHBACK TABLE', D19 + 'sqlrf/FLASHBACK-TABLE.html'],
    tbs: ['Administrator\'s Guide 19c · Managing Tablespaces', D19 + 'admin/managing-tablespaces.html'],
    users: ['Security Guide 19c · Creating User Accounts', D19 + 'dbseg/creating-user-accounts.html'],
    lsnrctl: ['Net Services Reference 19c · Listener Control Utility (HELP)', D19 + 'netrf/listener-control-utility.html'],
    rman: ['Backup and Recovery Reference 19c · RMAN (LOG)', D19 + 'rcmrf/RMAN.html'],
    rmantrb: ['Backup and Recovery User\'s Guide 19c · Troubleshooting RMAN Operations', D19 + 'bradv/troubleshooting-rman-operations.html'],
    backup: ['Backup and Recovery Reference 19c · BACKUP', D19 + 'rcmrf/BACKUP.html'],
    restore: ['Backup and Recovery Reference 19c · RESTORE', D19 + 'rcmrf/RESTORE.html'],
    recover: ['Backup and Recovery Reference 19c · RECOVER', D19 + 'rcmrf/RECOVER.html'],
    list: ['Backup and Recovery Reference 19c · LIST', D19 + 'rcmrf/LIST.html'],
    report: ['Backup and Recovery Reference 19c · REPORT', D19 + 'rcmrf/REPORT.html'],
    dbptc: ['Oracle Database Patch Maintenance (19c and Later)', 'https://docs.oracle.com/en/database/oracle/oracle-database/19/dbptc/index.html'],
    optch: ['OPatch User\'s Guide', 'https://docs.oracle.com/en/enterprise-manager/cloud-control/enterprise-manager-cloud-control/13.4/optch/oracle-opatch-users-guide.pdf'],
    opsi: ['26ai · Single-Instance Maintenance with OPatch', 'https://docs.oracle.com/en/database/oracle/oracle-database/26/dbpss/opatch-si.pdf'],
    regsqlp: ['Database Reference 19c · DBA_REGISTRY_SQLPATCH', D19 + 'refrn/DBA_REGISTRY_SQLPATCH.html'],
    maint: ['Backup and Recovery User\'s Guide 19c · Maintaining RMAN Backups', D19 + 'bradv/maintaining-rman-backups.html'],
    coreutils: ['GNU Coreutils 설명서', 'https://www.gnu.org/software/coreutils/manual/coreutils.html'],
  };

  /* ---------- 리눅스 명령 요약: man, --help, 힌트 주석에 함께 쓴다 ---------- */
  const REF = {
    grep: { d: '파일이나 입력에서 패턴이 있는 줄을 찾습니다.', syn: 'grep [옵션] 패턴 [파일...]', o: [['-i', '대소문자를 가리지 않음'], ['-n', '줄 번호를 함께 표시'], ['-c', '찾은 줄의 개수만 표시'], ['-v', '패턴이 없는 줄만 표시'], ['-l', '찾은 파일 이름만 표시'], ['-A N / -B N / -C N', '찾은 줄의 뒤 / 앞 / 앞뒤 N줄도 표시'], ['-E', "확장 정규식 (예: grep -E 'ORA-|TNS-' 파일)"]],
      tip: ['# 자주 쓰는 조합: grep -n ORA- 파일 (줄 번호), grep -c ORA- 파일 (개수), grep -A3 ORA- 파일 (뒤 3줄까지)', '# 결과를 파일로: grep ORA- 파일 > ~/ora_errors.txt (덮어쓰기), >> (이어 쓰기), | tee ~/ora_errors.txt (화면과 파일 둘 다)'] },
    ls: { d: '디렉터리 내용을 보여 줍니다.', syn: 'ls [옵션] [파일...]', o: [['-l', '자세히 (권한, 소유자, 크기, 시각)'], ['-a', '.으로 시작하는 숨김 파일도'], ['-h', '-l과 함께 쓰면 크기를 K, M, G로'], ['-t', '바뀐 시각이 최근인 순서로'], ['-r', '순서를 거꾸로'], ['-d', '디렉터리 안이 아니라 디렉터리 자체를']],
      tip: ['# 자주 쓰는 조합: ls -ltr (최근에 바뀐 파일이 맨 아래), ls -lh (크기를 읽기 쉽게), ls -la (숨김 파일까지)'] },
    cat: { d: '파일 내용을 그대로 출력합니다.', syn: 'cat [옵션] [파일...]', o: [['-n', '줄 번호를 붙여 출력']],
      tip: ['# 긴 파일은 less 파일 (/단어 로 찾기, n 다음, q 끝), 앞뒤만 볼 때는 head -20 파일, tail -50 파일'] },
    less: { d: '긴 파일을 한 화면씩 넘겨 봅니다.', syn: 'less [파일]', o: [['/단어', '아래로 찾기 (n 다음, N 이전)'], ['G / g', '맨 끝 / 맨 앞'], ['q', '끝내기']], tip: ['# 큰 로그는 cat 대신 less로 열고 /ORA- 로 찾으면 편합니다'] },
    head: { d: '파일의 앞부분을 출력합니다.', syn: 'head [옵션] [파일...]', o: [['-n N', '앞 N줄 (기본 10줄)']], tip: ['# head -n 30 파일 (앞 30줄)'] },
    tail: { d: '파일의 끝부분을 출력합니다.', syn: 'tail [옵션] [파일...]', o: [['-n N', '끝 N줄 (기본 10줄), tail -50 처럼 줄여 써도 됨'], ['-f', '파일 끝에 새 줄이 생기면 계속 보여 줌 (Ctrl+C로 끝)']],
      tip: ['# alert log 실시간 보기: tail -f alert_ORCL.log (Ctrl+C로 끝)', '# 최근 오류만 따로 저장: tail -500 alert_ORCL.log | grep ORA- > ~/recent_ora.txt'] },
    find: { d: '조건에 맞는 파일을 찾습니다.', syn: 'find [경로...] [조건]', o: [['-name "*.log"', '이름으로 (따옴표로 감싸기)'], ['-iname', '대소문자 없이 이름으로'], ['-type f / d', '파일만 / 디렉터리만'], ['-mtime +7', '7일보다 오래된 파일 (실제 서버)'], ['-size +1G', '1GB보다 큰 파일 (실제 서버)']],
      tip: ['# 권한 오류 줄 숨기기: find / -name "*.ora" 2>/dev/null', '# 실제 서버에서 자주 쓰는 조건: -mtime +7 (7일 지난 파일), -size +1G (1GB보다 큰 파일)'] },
    df: { d: '파일 시스템별 사용량을 보여 줍니다.', syn: 'df [옵션] [경로...]', o: [['-h', 'K, M, G 단위로 읽기 쉽게'], ['경로', '그 경로가 있는 파일 시스템만 (예: df -h /u01)']],
      tip: ['# 점검 기록 남기기: df -h > ~/df_check.txt'] },
    du: { d: '디렉터리와 파일이 차지한 공간을 보여 줍니다.', syn: 'du [옵션] [경로...]', o: [['-s', '합계만'], ['-h', '읽기 쉬운 단위']],
      tip: ['# 어디가 큰지: du -sh /u01/app/oracle/* | sort -h (작은 것부터, 큰 것이 맨 아래)'] },
    free: { d: '메모리와 스와프 사용량을 보여 줍니다.', syn: 'free [옵션]', o: [['-h', '읽기 쉬운 단위'], ['-m / -g', 'MB / GB 단위']], tip: ['# free -h 에서 available 열이 실제로 더 쓸 수 있는 메모리입니다'] },
    ps: { d: '실행 중인 프로세스를 보여 줍니다.', syn: 'ps [옵션]', o: [['-e', '모든 프로세스'], ['-f', '자세히 (UID, PID, PPID, 시작 시각, 명령)']],
      tip: ['# 자주 쓰는 조합: ps -ef | grep pmon (인스턴스가 떠 있는지), ps -ef | grep tnslsnr (리스너)'] },
    kill: { d: '프로세스에 신호를 보냅니다.', syn: 'kill [-신호] PID...', o: [['(신호 없음)', 'TERM: 정상 종료 요청'], ['-9', 'KILL: 강제 종료 (마지막 수단)']], tip: ['# 오라클 백그라운드 프로세스(pmon, smon 등)는 kill하지 않습니다. 세션은 ALTER SYSTEM KILL SESSION 으로 정리합니다'] },
    chmod: { d: '파일 권한을 바꿉니다.', syn: 'chmod [옵션] 모드 파일...', o: [['755', 'r=4 w=2 x=1 을 더한 숫자 (소유자/그룹/기타)'], ['u+x', '소유자에게 실행 권한 추가'], ['-R', '하위 디렉터리까지']], tip: ['# 숫자 읽는 법: r=4 w=2 x=1 → 755 = rwxr-xr-x, 640 = rw-r-----'] },
    chown: { d: '파일 소유자와 그룹을 바꿉니다.', syn: 'chown [옵션] 사용자[:그룹] 파일...', o: [['-R', '하위 디렉터리까지']], tip: ['# 오라클 디렉터리는 보통 chown -R oracle:oinstall 경로'] },
    mkdir: { d: '디렉터리를 만듭니다.', syn: 'mkdir [옵션] 디렉터리...', o: [['-p', '중간 디렉터리까지 한 번에, 이미 있어도 오류 없음']], tip: ['# mkdir -p /u01/app/oracle 처럼 -p 로 중간 경로까지 한 번에'] },
    cp: { d: '파일을 복사합니다.', syn: 'cp [옵션] 원본 대상', o: [['-p', '권한과 시각을 유지'], ['-r', '디렉터리째 복사']], tip: ['# 설정 파일을 고치기 전에 백업부터: cp -p 파일 파일.bak'] },
    mv: { d: '파일을 옮기거나 이름을 바꿉니다.', syn: 'mv [옵션] 원본 대상', o: [['-i', '덮어쓰기 전에 물어봄']], tip: [] },
    rm: { d: '파일을 지웁니다.', syn: 'rm [옵션] 파일...', o: [['-i', '지울 때마다 물어봄'], ['-r', '디렉터리째 (주의)'], ['-f', '묻지 않고 (주의)']], tip: ['# 지우기 전에 ls -l 로 대상을 먼저 확인합니다. 오라클 데이터 파일은 rm으로 지우지 않습니다'] },
    uname: { d: '시스템 정보를 보여 줍니다.', syn: 'uname [옵션]', o: [['-a', '전부'], ['-r', '커널 버전'], ['-m', '하드웨어 종류 (x86_64)']], tip: [] },
    id: { d: '사용자와 그룹 정보를 보여 줍니다.', syn: 'id [사용자]', o: [['사용자', '그 사용자의 UID, GID, 그룹 (예: id oracle)']], tip: ['# 다른 계정도 확인: id oracle'] },
    vmstat: { d: '메모리, CPU, 입출력 상태를 요약합니다.', syn: 'vmstat [간격 [횟수]]', o: [['2 5', '2초 간격으로 5번']], tip: ['# 실제 서버에서는 vmstat 2 5 처럼 여러 번 찍어 흐름을 봅니다 (r: 실행 대기, si/so: 스와프 입출력)'] },
    top: { d: '프로세스를 실시간으로 보여 줍니다.', syn: 'top', o: [['P / M', 'CPU 순 / 메모리 순 정렬 (실제 서버)'], ['q', '끝내기']], tip: ['# top 안에서 P는 CPU 순, M은 메모리 순, q는 끝'] },
    sysctl: { d: '커널 매개변수를 보고 바꿉니다.', syn: 'sysctl [옵션] [이름[=값]]', o: [['-a', '모든 값'], ['-p [파일]', '파일에 적은 값을 적용'], ['--system', '/etc/sysctl.d 의 파일을 모두 적용']], tip: ['# 현재 값 찾기: sysctl -a | grep shm', '# 바꾸기 전 값 기록: sysctl -a > ~/sysctl_before.txt'] },
    rpm: { d: 'RPM 패키지를 조회합니다.', syn: 'rpm -q [옵션] [패키지]', o: [['-q 이름', '설치 여부와 버전'], ['-qa', '설치된 모든 패키지'], ['-qi 이름', '자세한 정보 (실제 서버)']], tip: ['# 설치 여부 한 번에: rpm -qa | grep 이름'] },
    dnf: { d: '패키지를 설치하고 조회합니다 (Oracle Linux 8).', syn: 'dnf [명령] [패키지]', o: [['install 이름', '설치'], ['info 이름', '정보 (실제 서버)'], ['list installed', '설치된 목록 (실제 서버)']], tip: ['# 설치 여부는 rpm -q 이름 이 빠릅니다. dnf info 이름, dnf list installed 는 실제 서버에서 씁니다'] },
    ulimit: { d: '현재 셸의 자원 한도를 보여 줍니다.', syn: 'ulimit [옵션]', o: [['-a', '전부'], ['-Sn / -Hn', '열린 파일 수 소프트 / 하드 한도'], ['-Su / -Hu', '프로세스 수 소프트 / 하드 한도']], tip: ['# 오라클 사용자로 로그인해서 확인: ulimit -Sn; ulimit -Hn'] },
    ss: { d: '소켓(네트워크 연결) 상태를 보여 줍니다.', syn: 'ss [옵션]', o: [['-l', '듣고 있는 소켓'], ['-n', '이름 대신 숫자'], ['-t', 'TCP'], ['-p', '프로세스']], tip: ['# 리스너 포트 확인: ss -lnt | grep 1521'] },
    env: { d: '환경 변수를 보여 줍니다.', syn: 'env', o: [], tip: ['# 하나만 볼 때: echo $ORACLE_SID'] },
    tee: { d: '입력을 화면에 보여 주면서 파일에도 씁니다.', syn: '명령 | tee [옵션] 파일', o: [['-a', '파일을 덮어쓰지 않고 끝에 이어 씀']], tip: [] },
    sort: { d: '줄을 정렬합니다.', syn: 'sort [옵션] [파일]', o: [['-n', '숫자 크기로'], ['-h', '1K, 2M, 3G 같은 크기로'], ['-r', '거꾸로']], tip: [] },
    man: { d: '명령의 설명서를 보여 줍니다.', syn: 'man 명령', o: [], tip: [] },
    vi: { d: '파일을 편집합니다.', syn: 'vi 파일', o: [['i', '입력 모드'], ['Esc', '명령 모드로'], [':wq', '저장하고 끝'], [':q!', '저장하지 않고 끝'], ['/단어', '찾기 (실제 서버)']], tip: ['# 바꾸기 전에 cp -p 파일 파일.bak 로 백업해 두면 되돌리기 쉽습니다'] },
    useradd: { d: '사용자를 만듭니다.', syn: 'useradd [옵션] 사용자', o: [['-u UID', 'UID 지정'], ['-g 그룹', '기본 그룹'], ['-G 그룹,...', '보조 그룹']], tip: ['# 만든 뒤 id 사용자 로 그룹을 확인합니다'] },
    groupadd: { d: '그룹을 만듭니다.', syn: 'groupadd [옵션] 그룹', o: [['-g GID', 'GID 지정']], tip: ['# 확인: grep 그룹이름 /etc/group'] },
    usermod: { d: '사용자 정보를 바꿉니다.', syn: 'usermod [옵션] 사용자', o: [['-aG 그룹', '보조 그룹 추가 (-a 없이 -G만 쓰면 기존 보조 그룹이 바뀜)']], tip: ['# 보조 그룹 추가는 -aG (a를 빼면 기존 그룹이 사라집니다)'] },
    cd: { b: 1, d: '작업 디렉터리를 옮깁니다 (bash 내장 명령).', syn: 'cd [디렉터리]', o: [['(없음) / ~', '홈 디렉터리로'], ['-', '바로 전 디렉터리로'], ['..', '한 단계 위로']], tip: ['# cd - 는 바로 전 디렉터리, cd 만 치면 홈. 옮긴 뒤 pwd 로 확인'] },
    pwd: { b: 1, d: '지금 디렉터리의 전체 경로를 보여 줍니다.', syn: 'pwd', o: [], tip: [] },
    umask: { b: 1, d: '새로 만드는 파일의 기본 권한에서 뺄 값을 보여 주거나 정합니다 (bash 내장 명령).', syn: 'umask [값]', o: [['-S', 'u=rwx,g=rx,o=rx 처럼 글자로']], tip: ['# umask 022 → 새 파일 644, 새 디렉터리 755. 오라클 사용자는 보통 022'] },
    echo: { b: 1, d: '글자나 변수 값을 출력합니다 (bash 내장 명령).', syn: 'echo [글자...]', o: [['$변수', '환경 변수 값 (예: echo $ORACLE_SID)']], tip: ['# > 는 파일을 새로 쓰고(덮어쓰기), >> 는 끝에 이어 씁니다. 점검 기록은 >> 로 쌓으면 이력이 남습니다', '# 기록에 시각 남기기: date >> ~/report.txt'] },
    export: { b: 1, d: '환경 변수를 만들어 하위 프로세스에 넘깁니다 (bash 내장 명령).', syn: 'export 이름=값', o: [], tip: ['# 확인: echo $이름 또는 env | grep 이름. 로그인할 때마다 쓰려면 ~/.bash_profile 에 적습니다'] },
    source: { b: 1, d: '파일의 명령을 지금 셸에서 실행합니다 (bash 내장 명령, . 과 같음).', syn: 'source 파일', o: [], tip: ['# .bash_profile 을 고친 뒤에는 source ~/.bash_profile 또는 다시 로그인해야 반영됩니다'] },
    which: { d: '명령이 PATH의 어느 파일로 실행되는지 보여 줍니다.', syn: 'which 명령', o: [], tip: ['# 같은 이름의 명령이 여러 곳에 있을 때 어느 것이 실행되는지 확인합니다'] },
    whoami: { d: '지금 사용자 이름을 보여 줍니다.', syn: 'whoami', o: [], tip: ['# 더 자세히: id (UID, 그룹까지)'] },
    hostname: { d: '서버 이름을 보여 줍니다.', syn: 'hostname', o: [], tip: [] },
    touch: { d: '빈 파일을 만들거나 파일 시각을 바꿉니다.', syn: 'touch 파일...', o: [], tip: ['# 쓰기 권한 시험에 자주 씁니다. 만든 뒤 ls -l 로 소유자와 권한 확인'] },
    su: { d: '다른 사용자로 바꿉니다.', syn: 'su [-] [사용자]', o: [['-', '그 사용자의 로그인 환경(.bash_profile)까지 읽음']], tip: ['# su - oracle 처럼 - 를 붙여야 ORACLE_HOME 같은 환경 변수가 설정됩니다. 돌아올 때는 exit'] },
    passwd: { d: '사용자 암호를 바꿉니다.', syn: 'passwd [사용자]', o: [], tip: ['# 입력한 암호는 화면에 보이지 않습니다. root만 다른 사용자의 암호를 바꿀 수 있습니다'] },
    ssh: { d: '다른 서버에 접속합니다.', syn: 'ssh 사용자@서버', o: [], tip: ['# 처음 접속하는 서버는 호스트 키를 확인하라고 묻습니다 (yes). 끝낼 때는 exit'] },
    lsblk: { d: '블록 장치(디스크) 목록을 보여 줍니다.', syn: 'lsblk', o: [], tip: [] },
    unzip: { d: 'zip 압축을 풉니다.', syn: 'unzip [옵션] 파일.zip [-d 디렉터리]', o: [['-q', '푸는 파일 목록을 보여 주지 않음'], ['-d 디렉터리', '그 디렉터리에 풂 (없으면 지금 디렉터리)'], ['-l', '풀지 않고 목록만 (실제 서버)'], ['-o', '묻지 않고 덮어씀 (주의)']], tip: ['# 풀기 전에 목록만 보기: unzip -l 파일.zip (실제 서버). 오라클 패치는 받은 그대로의 zip을 보관해 두면 다시 풀 수 있습니다'] },
  };
  REF.more = REF.less; REF.vim = REF.vi; REF.yum = REF.dnf; REF.printenv = REF.env;

  /* ---------- 오라클 명령 주석 ---------- */
  const ORA = [
    // [정규식(줄 맨 앞, 대문자로 비교), 맥락, 주석 줄, 근거]
    [/^I\s+→/, 'sh', ['# vi: i 입력 모드, Esc 명령 모드, :wq 저장하고 끝, :q! 저장하지 않고 끝', '# 고치기 전에 cp -p 파일 파일.bak 로 백업해 두면 되돌리기 쉽습니다'], []],
    [/^SQLPLUS\b/, 'sh', ['# 접속한 뒤 HELP INDEX 로 SQL*Plus 명령 목록, HELP 명령이름 으로 문법을 볼 수 있습니다'], ['help']],
    [/^LSNRCTL\b/, 'sh', ['# 명령 목록: lsnrctl help (LSNRCTL> 프롬프트에서는 HELP 명령이름 으로 한 명령의 문법)', '# 점검 기록 남기기: lsnrctl status > ~/lsnr_status.txt'], ['lsnrctl']],
    [/^RMAN\b/, 'sh', ['# 작업 기록을 파일로: rman target / log /home/oracle/rman.log (결과는 화면 대신 파일에 쌓이고, 끝에 append 를 붙이면 이어 쓰기)', '# 화면과 파일 둘 다: rman | tee rman.log (문서에 나온 방법, 실제 서버)'], ['rman', 'rmantrb']],
    [/^SET\s+(LIN|PAGES|FEED|HEA|NUMW|TIMI|TRIMS)/, 'sql', ['-- SET 항목 전체와 문법: HELP SET', '-- 지금 설정값 보기: SHOW ALL, 하나만: SHOW LINESIZE', '-- 기본값은 LINESIZE 80, PAGESIZE 14 (긴 결과는 SET PAGESIZE 100 도 함께)'], ['set', 'help', 'show']],
    [/^(COL|COLUMN)\b/, 'sql', ['-- 문법: HELP COLUMN', '-- 설정 지우기: COLUMN 열이름 CLEAR, 모두 지우기: CLEAR COLUMNS'], ['column', 'help']],
    [/^SHOW\s+PARAMETER/, 'sql', ['-- 이름 일부만 써도 됩니다: SHOW PARAMETER recovery', '-- 바꾸기 전 값을 파일로 남기기: SPOOL /home/oracle/param_before.txt → SHOW PARAMETER ... → SPOOL OFF'], ['show', 'spool']],
    [/^SHOW\b/, 'sql', ['-- 모든 설정 보기: SHOW ALL, 문법: HELP SHOW'], ['show', 'help']],
    [/^SELECT\b.*DBA_REGISTRY_SQLPATCH/, 'sql', ['-- 줄이 적용·롤백마다 쌓입니다. ORDER BY install_id 로 보면 순서대로 읽힙니다', '-- STATUS 가 SUCCESS 가 아니면 LOGFILE 열의 로그를 엽니다'], ['regsqlp']],
    [/^SELECT\b.*\b(V\$|DBA_|GV\$)/, 'sql', ['-- 어떤 열이 있는지: DESC 뷰이름 (예: DESC v$session)', '-- 결과를 파일로: SPOOL /home/oracle/result.txt → 쿼리 → SPOOL OFF (확장자를 안 쓰면 .lst)', '-- 열이 잘려 보이면: SET LINESIZE 200, COLUMN 열이름 FORMAT a30'], ['spool', 'sqlqr']],
    [/^SELECT\b/, 'sql', ['-- 결과를 파일로: SPOOL /home/oracle/result.txt → 쿼리 → SPOOL OFF (확장자를 안 쓰면 .lst)', '-- 테이블 구조 보기: DESC 테이블이름'], ['spool', 'sqlqr']],
    [/^CONN(ECT)?\b/, 'sql', ['-- 지금 누구로 접속했는지: SHOW USER', '-- 문법: HELP CONNECT'], ['help']],
    [/^ARCHIVE\s+LOG\s+LIST/, 'sql', ['-- 같은 정보를 SQL로: SELECT log_mode FROM v$database;'], []],
    [/^ORAPWD\b/, 'sh', ['# 만든 뒤 확인: SQL*Plus에서 SELECT username, sysdba FROM v$pwfile_users;'], []],
    [/^SQL\s+'/, 'rman', ["# RMAN 안에서 SQL 문을 실행합니다. SQL 문은 작은따옴표 안에 씁니다"], []],
    [/^EXEC(UTE)?\b/, 'sql', ['-- EXEC 는 PL/SQL 한 문장을 BEGIN ... END; 로 감싸 실행하는 SQL*Plus 명령입니다', '-- 스냅샷 확인: SELECT snap_id, begin_interval_time FROM dba_hist_snapshot ORDER BY snap_id;'], []],
    [/^@/, 'sql', ['-- @파일 은 SQL 스크립트를 실행합니다. ? 와 $ORACLE_HOME 은 오라클 홈 경로입니다', '-- 만든 보고서 파일은 sqlplus를 시작한 디렉터리에 생깁니다 (HOST ls -lt 로 확인)'], []],
    [/^(STARTUP|SHUTDOWN)\b/, 'sql', ['-- 옵션 보기: HELP STARTUP, HELP SHUTDOWN', '-- 진행 기록은 alert log에 남습니다: host tail -50 /u01/app/oracle/diag/rdbms/orcl/ORCL/trace/alert_ORCL.log'], ['startup', 'help']],
    [/^ALTER\s+SYSTEM\b/, 'sql', ['-- 바꾸기 전 값 확인: SHOW PARAMETER 이름 (SPOOL로 남겨 두면 되돌릴 때 편함)', '-- 문법: SQL Language Reference 19c 의 ALTER SYSTEM'], ['altersys']],
    [/^ALTER\s+DATABASE\b/, 'sql', ['-- 문법: SQL Language Reference 19c 의 ALTER DATABASE', '-- 결과 확인: SELECT status FROM v$instance; SELECT open_mode FROM v$database;'], ['alterdb']],
    [/^ALTER\s+TABLESPACE\b/, 'sql', ['-- 확인: SELECT tablespace_name, status FROM dba_tablespaces;', '-- 관리 방법: Administrator\'s Guide 19c 의 Managing Tablespaces'], ['tbs']],
    [/^(ALTER|CREATE)\s+USER\b/, 'sql', ['-- 확인: SELECT username, account_status FROM dba_users WHERE username = \'이름\';', '-- 문법: SQL Language Reference 19c 의 CREATE USER'], ['createuser', 'users']],
    [/^GRANT\b/, 'sql', ['-- 확인: SELECT * FROM dba_tab_privs WHERE grantee = \'이름\'; (시스템 권한은 dba_sys_privs)', '-- 문법: SQL Language Reference 19c 의 GRANT'], ['grant']],
    [/^FLASHBACK\s+TABLE\b/, 'sql', ['-- 휴지통 보기: SHOW RECYCLEBIN', '-- 문법: SQL Language Reference 19c 의 FLASHBACK TABLE'], ['flashback']],
    [/^(BACKUP)\b/, 'rman', ['# 문법: Backup and Recovery Reference 19c 의 BACKUP (RMAN에는 HELP 명령이 없어 문서를 봅니다)', '# 백업 뒤 확인: LIST BACKUP SUMMARY;'], ['backup']],
    [/^(RESTORE)\b/, 'rman', ['# 문법: Backup and Recovery Reference 19c 의 RESTORE'], ['restore']],
    [/^(RECOVER)\b/, 'rman', ['# 문법: Backup and Recovery Reference 19c 의 RECOVER'], ['recover']],
    [/^(LIST)\b/, 'rman', ['# 문법: Backup and Recovery Reference 19c 의 LIST', '# 결과를 파일로 남기려면 rman target / log /home/oracle/rman_list.log 로 시작'], ['list', 'rman']],
    [/^(REPORT)\b/, 'rman', ['# 문법: Backup and Recovery Reference 19c 의 REPORT'], ['report']],
    [/^(DELETE|CROSSCHECK)\b/, 'rman', ['# 지우기 전에 대상 확인: REPORT OBSOLETE;', '# 관리 방법: Backup and Recovery User\'s Guide 19c 의 Maintaining RMAN Backups'], ['maint']],
    [/(^|\/)OPATCH\s+LSPATCHES\b/, 'sh', ['# 명령 목록: opatch -help, 한 명령의 옵션: opatch lsinventory -help (실제 서버)', '# 기록 남기기: $ORACLE_HOME/OPatch/opatch lspatches > ~/lspatches_before.txt'], ['optch']],
    [/(^|\/)OPATCH\s+LSINVENTORY\b/, 'sh', ['# OPatch 는 PATH에 없어서 $ORACLE_HOME/OPatch/opatch 처럼 경로로 실행합니다', '# 패치 전후로 > 파일 로 한 부씩 저장해 두세요. 문제가 생기면 지원 엔지니어가 가장 먼저 찾는 기록입니다'], ['optch', 'opsi']],
    [/(^|\/)OPATCH\s+VERSION\b/, 'sh', ['# 패치 README가 요구하는 OPatch 최소 버전과 비교합니다. 새 OPatch는 패치 6880880 (My Oracle Support Note 6880880.1)'], ['dbptc']],
    [/(^|\/)OPATCH\s+PREREQ\b/, 'sh', ['# 압축을 푼 패치 디렉터리에서 실행합니다 (-ph ./). 점검 전날까지 해 두세요', '# 결과 저장: ... -ph ./ > ~/prereq_result.txt'], ['opsi']],
    [/(^|\/)OPATCH\s+(APPLY|ROLLBACK)\b/, 'sh', ['# 실행 전 확인: ps -ef | grep pmon, ps -ef | grep tnslsnr (이 홈의 DB와 리스너가 모두 내려가 있어야 함)', '# 진행 기록은 화면의 Log file location 에 남습니다. 실패하면 그 로그부터 봅니다', '# 미리 보기만: opatch apply -report (실제로 바꾸지 않음, OPatch User\'s Guide)'], ['opsi', 'optch']],
    [/(^|\/)DATAPATCH\b/, 'sh', ['# DB가 열려 있어야 합니다(startup 먼저). -sanity_checks 로 점검한 뒤 -verbose 로 적용', '# 결과 확인: SELECT patch_id, action, status FROM dba_registry_sqlpatch ORDER BY install_id;', '# 로그 위치는 "Log file for this invocation:" 줄에 나옵니다'], ['opsi', 'regsqlp']],
  ];

  const LIN = Object.keys(REF);
  function linesFor(line) {
    let t = line.trim().replace(/^(SQL>|RMAN>|\$|#)\s*/, '');
    if (!t || /^[(（]/.test(t)) return null;
    const host = /^(?:(?:host|ho)\s+|!\s*)(.+)$/i.exec(t); if (host) t = host[1];
    const U = t.toUpperCase();
    for (const [re, ctx, lines, src] of ORA) if (re.test(U)) return { key: re.source, lines, src };
    const first = t.split(/\s+/)[0];
    const segs = t.split('|').map(s => s.trim().split(/\s+/)[0]);
    const out = []; const src = [];
    for (const name of segs) {
      const r = REF[name]; if (!r) continue;
      out.push(r.b ? `# 찾아보기: help ${name} (bash 내장 명령)` : `# 옵션 찾아보기: ${name} --help 또는 man ${name}`);
      out.push(...r.tip);
    }
    if (!out.length) return null;
    if (/\s>>?\s/.test(t) || /\|\s*tee\b/.test(t)) out.push('# > 는 덮어쓰기, >> 는 이어 쓰기, | tee 파일 은 화면과 파일에 함께 씁니다');
    if (['ls', 'cat', 'df', 'du', 'head', 'tail', 'cp', 'mkdir', 'chmod', 'chown', 'rm', 'mv', 'sort', 'tee'].includes(first)) src.push('coreutils');
    return { key: segs.join('|'), lines: out, src };
  }

  function html(hint, esc) {
    if (!hint) return '';
    const seen = new Set(), lines = [], srcs = [];
    for (const l of String(hint).split('\n')) {
      const r = linesFor(l); if (!r) continue;
      for (const x of r.lines) if (!seen.has(x)) { seen.add(x); lines.push(x); }
      for (const s of r.src) if (!srcs.includes(s)) srcs.push(s);
    }
    if (!lines.length) return '';
    const links = srcs.map(k => S[k]).filter(Boolean).map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${esc(t)}</a>`).join(' · ');
    return `<div class="tips" aria-label="실무 메모">${lines.map(x => `<span class="tip-line">${esc(x)}</span>`).join('\n')}${links ? `\n<span class="tip-src">근거: ${links}</span>` : ''}</div>`;
  }

  /* man, --help 출력 (실습용 요약) */
  function manText(name, how) {
    const r = REF[name]; if (!r) return null;
    const w = Math.max(10, ...r.o.map(o => o[0].length));
    const body = `${how === 'man' ? `${name.toUpperCase()}(1)\n\n이름\n    ${name} - ${r.d}\n\n형식\n    ${r.syn}\n` : `사용법: ${r.syn}\n${r.d}\n`}${r.o.length ? `\n${how === 'man' ? '주요 옵션\n' : ''}${r.o.map(([a, b]) => `    ${a.padEnd(w)}  ${b}`).join('\n')}\n` : ''}${r.tip.length ? `\n${r.tip.map(x => x.replace(/^# /, '실무: ')).join('\n')}\n` : ''}`;
    return body;
  }

  window.Tips = { html, ref: (n) => REF[n] || null, manText, SRC: S };
})();
