# Oracle 해부도

Oracle Database 19c의 내부 구조를 한 단계씩 넘겨 보며 이해하는 인터랙티브 학습 사이트입니다.

**사이트:** https://batiappa.github.io/oracle-anatomy/

![COMMIT의 여정 레슨 화면](og.jpg)

## 무엇을 보여 주나

첫 레슨 **COMMIT의 여정**은 `UPDATE` 한 문장과 `COMMIT` 한 번을 10단계로 따라갑니다. 주요 내용은 다음과 같습니다.

1. 블록을 Buffer Cache로 읽기
2. 이전 값을 Undo에 기록
3. 변경 벡터를 Redo Log Buffer에 기록하고 블록이 dirty가 됨
4. `COMMIT`: SCN 할당, 커밋 레코드, LGWR 호출, `log file sync` 대기
5. LGWR의 온라인 Redo 로그 순차 쓰기
6. DBWn의 지연 쓰기와 Write-Ahead Logging
7. 사례: 커밋 직후 정전과 SMON 인스턴스 복구
8. 사례: 한 건마다 커밋하는 배치와 `log file sync`

단계마다 오른쪽 설명, 왼쪽 다이어그램, 위쪽 지표(SCN, dirty 블록, Redo 버퍼, 대기 시간), 아래쪽 SQL*Plus·alert.log 화면이 함께 바뀝니다.

## 리눅스 실습실 (`lab/`)

**주소:** https://batiappa.github.io/oracle-anatomy/lab/

실무 경험이 없는 신입 DBA가 Oracle Linux 8 서버를 흉내 낸 브라우저 터미널에 직접 명령을 입력하며 익히는 실습 과정입니다. 리눅스 실습실(1·2단계)과 DBA 실습(3~11단계)은 하나의 "실습 과정"으로 이어집니다. 두 화면 위쪽에 같은 단계 메뉴가 있어 1~11단계의 진행률(완료한 레슨 수)을 한눈에 보고 어느 단계로든 바로 갈 수 있습니다. 단계 메뉴는 두 화면이 함께 쓰는 `course.js`가 그리고, 진행률은 각 화면이 브라우저에 저장한 값(`ohb:lab:done`, `ohb:dba:done`)을 함께 읽어 계산합니다.

### 1단계 · 리눅스 기초 (Oracle 19c가 이미 돌아가는 dbserver01, oracle 계정)

| 레슨 | 내용 | 주요 명령 |
|---|---|---|
| 1 | DB 서버에 처음 접속하기 | `ssh`, `whoami`, `hostname`, `cat /etc/os-release`, `uname -r` |
| 2 | 오라클이 사는 디렉터리 둘러보기(OFA) | `pwd`, `ls -la`, `cd`, `mkdir`, `cp` |
| 3 | alert log에서 오류 찾기(ADR) | `tail -n`, `grep -n`, `tail -f`, Ctrl+C |
| 4 | vi로 작업 일지 쓰기 | `vi`, `i`, `o`, `Esc`, `:wq`, `:q!` |
| 5 | oracle 계정과 권한 | `id`, `chmod`, `su -`, `chown`, `exit` |
| 6 | 프로세스로 DB 상태 확인 | `ps -ef \| grep pmon`, `top`, `kill` |
| 7 | 디스크가 찼다는 연락 대응 | `df -h`, `du -sh`, `ls -lh`, `rm`, `free -m` |
| 8 | 환경 변수 설정 | `echo $ORACLE_HOME`, `vi ~/.bash_profile`, `source`, `which sqlplus` |
| 9 | 졸업 미션: 아침 점검 | 배운 명령 종합 |

### 2단계 · 오라클을 위한 리눅스 준비 (오라클이 없는 새 서버 dbserver02, root 계정)

설치 가이드(Oracle Database Installation Guide for Linux 19c)의 순서를 따릅니다. 주소의 레슨 번호는 `#lesson-10`부터 `#lesson-18`입니다.

| 레슨 | 내용 | 주요 명령 |
|---|---|---|
| 1 | 설치 전 서버 점검(OS, 커널, 아키텍처, RAM·스왑, /tmp, 공간, 호스트 이름) | `uname -r`, `grep MemTotal /proc/meminfo`, `df -h`, `ping -c 1` |
| 2 | preinstall RPM으로 설치 준비 | `rpm -q`, `dnf install oracle-database-preinstall-19c`, `id oracle` |
| 3 | 커널 파라미터 확인 | `cat /etc/sysctl.d/...`, `sysctl kernel.sem`, `sysctl -a`, `sysctl --system` |
| 4 | 자원 제한(limits) 확인 | `su - oracle`, `ulimit -Sn`, `ulimit -Hn` |
| 5 | HugePages 설정과 THP 확인 | `grep Huge /proc/meminfo`, `vm.nr_hugepages`, `cat /sys/kernel/mm/transparent_hugepage/enabled` |
| 6 | 디스크 I/O 스케줄러와 클럭 소스 | `lsblk`, `cat /sys/block/sdb/queue/scheduler` |
| 7 | 직무 분리 그룹과 grid 사용자 | `groupadd -g`, `useradd -u -g -G`, `usermod`, `passwd` |
| 8 | 설치 디렉터리와 경로 규칙(심볼릭 링크, oraInst.loc) | `ls -ld`, `mkdir -p`, `chown -R`, `chmod -R 775` |
| 9 | 졸업 미션: 손으로 준비한 서버의 빠진 곳 5개 찾아 고치기 | 배운 명령 종합 |

- 실제 리눅스가 아니라 JavaScript로 만든 가상 파일 시스템과 셸입니다. 서버 비용이 없고, 무엇을 지워도 "레슨 다시 시작"으로 되돌릴 수 있습니다.
- 기준 값은 공식 자료에서 가져왔습니다. `/etc/os-release`는 `oraclelinux-release-8.10` 패키지, `.bash_profile`과 `.bashrc`는 `bash-4.4.20-6.el8_10` 패키지의 `/etc/skel`, oracle 사용자와 그룹 ID(54321 등)와 커널 파라미터는 `oracle-database-preinstall-19c-1.0-4.el8` 패키지에서 그대로 옮겼습니다. 디렉터리 구조는 Oracle 19c 설치 가이드의 OFA 예시, alert log 위치는 Administrator's Guide의 ADR 설명을 따릅니다. 레슨마다 화면에 출처 링크가 있습니다.
- 2단계의 패키지 버전은 yum.oracle.com의 Oracle Linux 8 저장소 목록에서, preinstall RPM이 바꾸는 값(커널 파라미터, 자원 제한, 사용자·그룹, THP와 `numa=off` 부팅 옵션, 기록 파일 위치)은 `oracle-database-preinstall-19c-1.0-4.el8` 패키지를 풀어 그 안의 `.param` 파일과 verify 스크립트에서 확인했습니다. 설치 전 커널 기본값, 기본 자원 제한, 디스크 구성은 예시입니다. ORAchk와 설치 프로그램(runInstaller, fixup 스크립트)은 흉내 내지 않고 해설로만 다룹니다.
- 열 간격, 날짜, 크기, PID, IP, 서버 이름 같은 값은 설명용 예시입니다.

## DBA 실습 (`dba/`)

**주소:** https://batiappa.github.io/oracle-anatomy/dba/

리눅스 실습실 다음 단계입니다. 2단계에서 준비한 dbserver02에 Oracle Database 19c를 설치하고 ORCL 데이터베이스를 만든 상황에서, 가상 터미널로 SQL*Plus, lsnrctl, RMAN, orapwd, dgmgrl, 그리고 RAC의 crsctl·srvctl·olsnodes를 직접 다룹니다. 주소의 레슨 번호는 3단계가 `#lesson-21`부터 `#lesson-29`, 4단계가 `#lesson-91`부터 `#lesson-96`, 5단계가 `#lesson-31`부터 `#lesson-36`, 6단계가 `#lesson-41`부터 `#lesson-43`, 7단계가 `#lesson-51`부터 `#lesson-53`, 8단계가 `#lesson-61`부터 `#lesson-63`, 9단계가 `#lesson-71`부터 `#lesson-73`, 10단계가 `#lesson-81`부터 `#lesson-83`, 11단계가 `#lesson-101`부터 `#lesson-103`입니다. 단계 번호는 배우는 순서이고 레슨 번호는 만든 순서라서 둘이 어긋납니다.

### 3단계 · 오라클 19c 기본 운영 (dbserver02, oracle 계정)

| 레슨 | 내용 | 주요 명령 |
|---|---|---|
| 1 | SQL*Plus로 처음 접속하기(OS 인증) | `sqlplus / as sysdba`, `show user`, `v$instance`, `v$database`, `set linesize`, `col ... format` |
| 2 | DB 내리고 단계별로 올리기 | `shutdown immediate`, `startup nomount`, `alter database mount/open`, `host ps -ef` |
| 3 | 리스너 살리고 원격 접속 확인하기 | `lsnrctl status/start/services`, `alter system register`, `sqlplus app/...@ORCL` |
| 4 | 꽉 찬 테이블스페이스에 공간 늘리기(ORA-1653) | `dba_data_files`, `dba_free_space`, `alter tablespace ... add datafile` |
| 5 | 조회 전용 사용자 만들고 권한 주기 | `create user`, `grant create session`, `grant select on`, `dba_tab_privs` |
| 6 | 지워진 암호 파일 다시 만들기 | `orapwd file=... format=12.2`, `v$pwfile_users`, `grant sysbackup` |
| 7 | 락을 잡고 있는 세션 정리하기 | `v$session.blocking_session`, `v$process.spid`, `alter system kill session 'sid,serial#'` |
| 8 | 아카이브 모드로 바꾸고 첫 RMAN 백업 받기 | `archive log list`, `alter database archivelog`, `rman target /`, `backup database plus archivelog` |
| 9 | 졸업 미션: 재부팅 뒤 아침 점검 | 배운 명령 종합, `alter user ... account unlock` |

### 4단계 · SQL 기초 (dbserver02, 실습용 STUDY 계정)

SQL 문법을 처음 배우는 단계입니다. 실습용 STUDY 스키마에 부서(DEPT) 4개와 사원(EMP) 10명이 들어 있습니다.

| 레슨 | 내용 | 주요 명령 |
|---|---|---|
| 1 | SELECT로 테이블 읽기 | `sqlplus study/...`, `user_tables`, `desc`, `select * from`, 계산 열과 별칭, `distinct` |
| 2 | WHERE로 고르고 ORDER BY로 정렬하기 | `where`, `and`, `like`, `between`, `= null`과 `is null` 비교, `order by ... desc` |
| 3 | 함수와 GROUP BY로 집계하기 | `count(*)`와 `count(열)`, `sum`, `round(avg())`, `to_char(날짜)`, `group by`, ORA-00937, `having` |
| 4 | 조인과 서브쿼리 | `join ... on`, 쉼표와 WHERE 조인, `left join`(부서 없는 사원, 사원 없는 부서), 스칼라 서브쿼리, `in (서브쿼리)` |
| 5 | INSERT·UPDATE·DELETE와 COMMIT·ROLLBACK | `insert`, `update`, `delete`, `commit`, `rollback`, ORA-00001, ORA-01400 |
| 6 | 졸업 미션: 테이블 만들고 보고서 뽑기 | `create table`(PRIMARY KEY, FOREIGN KEY, NOT NULL), `user_constraints`, ORA-02291, `spool` 파일 |

- 근거: SQL Language Reference 19c(SELECT, 조인, 하위 질의, 집계 함수, NULL, INSERT·UPDATE·DELETE, COMMIT, CREATE TABLE과 제약 조건), Database Concepts 19c(트랜잭션, 제약 조건 위반 예시), SQL*Plus User's Guide 19c(SET FEEDBACK, EXITCOMMIT).
- 확인하지 못한 것: "1 row created." 같은 DML 피드백 문구, ORA-02291, 02292, 01407, 12899, 01722, 01438, 00937, 00979, 01427의 화면 문구 전체. 터미널에 ⓘ 줄로 알립니다. 사원·부서 데이터는 설명용 예시입니다.

### 5단계 · 장애 대응과 복구 (dbserver02, oracle 계정, ARCHIVELOG + 백업이 있는 ORCL)

| 레슨 | 내용 | 주요 명령 |
|---|---|---|
| 1 | 지워진 데이터 파일 하나 되살리기(DB는 연 채로, ORA-01116) | `validate database`, `alter tablespace ... offline immediate`, `restore/recover tablespace`, `online` |
| 2 | SYSTEM 데이터 파일을 잃은 DB 살리기(ORA-01157) | `startup`, `v$recover_file`, MOUNT 상태에서 `restore/recover datafile 1`, `alter database open` |
| 3 | 컨트롤 파일 사본 하나를 잃었을 때(ORA-00205) | alert log의 ORA-00202, `show parameter control_files`, `shutdown abort`, 살아남은 사본 `cp` |
| 4 | 빠른 복구 영역이 가득 차 DB가 멈췄을 때(ORA-00257, ORA-19809) | `v$recovery_file_dest`, `alter system set db_recovery_file_dest_size`, `delete noprompt obsolete` |
| 5 | 실수로 지운 테이블 되살리기 | `show recyclebin`, `flashback table ... to before drop`, `dba_recyclebin` |
| 6 | 졸업 미션: 장애가 겹친 아침 | 데이터 파일 복구 + Flashback Drop + 장애 보고서 |

- 복구 순서(OFFLINE → RESTORE → RECOVER → ONLINE, MOUNT 상태 복구), 컨트롤 파일 사본 복사, ORA-19809의 해결책, FLASHBACK TABLE 문법은 Backup and Recovery User's Guide 19c, Administrator's Guide 19c, SQL Language Reference 19c와 19c 오류 도움말에서 확인했습니다. FRA가 가득 찼을 때의 대응 절은 18c 문서에서만 찾았고, 그렇다고 화면에 적었습니다.

### 6단계 · 고급 복구

| 레슨 | 내용 | 주요 명령 |
|---|---|---|
| 1 | 실수(TRUNCATE) 직전 시각으로 DB 되돌리기 | `export NLS_DATE_FORMAT`, `run { set until time ...; restore database; recover database; }`, `alter database open resetlogs` |
| 2 | 컨트롤 파일을 모두 잃었을 때 | `restore controlfile from autobackup`, `alter database mount`, `recover database`, `open resetlogs` |
| 3 | 졸업 미션: 지워진 테이블과 빈 휴지통 | Flashback Drop 실패 확인 → 시점 복구 → 새 백업 → 보고서 |

### 7단계 · 성능 점검

| 레슨 | 내용 | 주요 명령 |
|---|---|---|
| 1 | 지금 무엇을 기다리는지 보기 | `v$session`(EVENT, WAIT_CLASS), `v$sql`, `v$system_event`, `v$sys_time_model` |
| 2 | AWR 보고서로 지난밤 배치 들여다보기 | `dba_hist_snapshot`, `dbms_workload_repository.create_snapshot`, `@$ORACLE_HOME/rdbms/admin/awrrpt.sql` |
| 3 | 졸업 미션: 주문 저장이 멈춘 아침 | `enq: TX - row lock contention`, `blocking_session`, `alter system kill session` |

- 6단계 절차는 Backup and Recovery User's Guide 19c(DBPITR, 백업 컨트롤 파일로 복구)와 Backup and Recovery Reference 19c(RESTORE, RECOVER, untilClause)를, 7단계는 Performance Tuning Guide 19c와 Database Reference 19c 부록 C(대기 이벤트)를 따랐습니다. awrrpt.sql의 질문 문구는 18c와 26ai 판 문서에서 원문을 확인했습니다(19c 해당 절은 확인한 범위 밖). AWR은 Oracle Diagnostics Pack 라이선스가 필요하다는 문서의 안내도 레슨에 적었습니다.

### 8단계 · 패치 (OPatch와 분기별 RU)

| 레슨 | 내용 | 주요 명령 |
|---|---|---|
| 1 | 패치 전 점검: 지금 버전과 받아 둔 RU 확인 | `opatch lspatches`, `opatch lsinventory -detail -oh $ORACLE_HOME > 파일`, `dba_registry_sqlpatch`, `unzip`, `opatch version`, OPatch 교체(패치 6880880), `opatch prereq CheckConflictAgainstOHWithDetail -ph ./` |
| 2 | 정기점검: RU 적용하고 datapatch 돌리기 | `shutdown immediate`, `lsnrctl stop`, `opatch apply`, `startup`, `./datapatch -sanity_checks`, `./datapatch -verbose`, `dba_registry_sqlpatch` |
| 3 | 졸업 미션: RU 되돌리기 | `opatch rollback -id`, `./datapatch -verbose`, ROLLBACK 기록 확인 |

- 근거: Oracle Database Patch Maintenance(19c and Later)의 RU 주기(1·4·7·10월 셋째 화요일)와 out-of-place 권장, Upgrade Guide 19c의 버전 번호 설명, Database Reference 19c의 DBA_REGISTRY_SQLPATCH, OPatch User's Guide의 lsinventory·lspatches·rollback 형식. 단일 인스턴스 패치 절차(사전 lsinventory 저장, 충돌 검사, DB와 리스너 종료, opatch apply, datapatch -sanity_checks와 -verbose, SUCCESS 확인)는 19c판 문서에서 같은 장을 찾지 못해 26ai판 "Single-Instance Maintenance with OPatch"를 인용했고, 화면에도 그렇게 적었습니다.
- OPatch와 datapatch의 화면 예시는 공식 문서에서 찾지 못했습니다. 실습 화면은 줄인 흉내이고 ⓘ 줄로 알립니다. 패치 번호(38291812), RU 버전(19.29), OPatch 버전 번호(12.2.0.1.17, 12.2.0.1.47)는 설명용 예시 값입니다.

### 9단계 · SQL 튜닝 입문 (실행 계획과 인덱스)

| 레슨 | 내용 | 주요 명령 |
|---|---|---|
| 1 | 느린 SQL의 실행 계획 읽기 | `explain plan for ...`, `select * from table(dbms_xplan.display)`, `user_ind_columns`, `dbms_xplan.display_cursor('sql_id')` |
| 2 | 조건을 고쳐 인덱스 타게 하기 | `to_char(order_date,'YYYYMM')` → `order_date >= date '...' and order_date < date '...'`, TABLE ACCESS FULL → INDEX RANGE SCAN |
| 3 | 졸업 미션: 고객별 주문 조회가 느린 아침 | `v$sql`, `dba_tab_statistics`(STALE_STATS), `dbms_stats.gather_table_stats`, `create index ... online` |

- 근거: SQL Tuning Guide 19c(실행 계획 만들기와 보기, 접근 경로, 인덱스를 쓰지 못하는 이유 표, 통계 수집 예), PL/SQL Packages and Types Reference 19c의 DBMS_XPLAN(DISPLAY, DISPLAY_CURSOR 인수), SQL Language Reference 19c의 EXPLAIN PLAN과 CREATE INDEX(ONLINE, 함수 기반 인덱스 예). "Explained."와 DISPLAY_CURSOR의 `SQL_ID  ..., child number 0` 머리줄, 계획 표의 열 제목은 문서 예시와 같습니다.
- 실습의 옵티마이저는 "인덱스 첫 열에 함수 없이 = 나 범위 조건이 있으면 인덱스를 쓴다"는 단순한 규칙만 흉내 냅니다. Rows, Bytes, Cost, Time과 Plan hash value는 설명용 예시입니다.

### 10단계 · Data Guard 기초 (주 DB와 물리 대기 DB)

dbserver02의 주 DB(DB_UNIQUE_NAME orcl)와 dbserver03의 물리 대기 DB(orclstby)가 Data Guard 브로커 구성(orcl_dg, MaxPerformance)으로 묶여 있는 상황입니다.

| 레슨 | 내용 | 주요 명령 |
|---|---|---|
| 1 | 주 DB와 대기 DB 상태 점검 | `dgmgrl /`, `show configuration`, `show database orclstby`, `sqlplus sys/...@ORCLSTBY as sysdba`, `v$database`(DATABASE_ROLE, DB_UNIQUE_NAME), `v$dataguard_stats`, `v$dataguard_process` |
| 2 | 적용이 멈춘 대기 DB | `show database`의 Intended State APPLY-OFF와 Apply Lag, `edit database orclstby set state='APPLY-ON'` |
| 3 | 졸업 미션: 계획된 전환(스위치오버) | `validate database orclstby`, `switchover to orclstby`, 두 서버의 `v$database` 역할 확인 |

- 근거: Data Guard Broker 19c의 DGMGRL 예시(SHOW CONFIGURATION, SHOW DATABASE, EDIT DATABASE SET STATE, SWITCHOVER 출력)와 명령 설명(CONNECT, VALIDATE DATABASE), Data Guard Concepts and Administration 19c의 Redo Apply와 역할 전환(스위치오버는 데이터 손실이 없음, 브로커 사용 권장), Database Reference 19c의 V$DATAGUARD_STATS(주 DB에서는 행이 없음)와 V$DATAGUARD_PROCESS.
- 적용 지연이 시간 단위일 때의 표시, 주 DB 쪽 SHOW DATABASE, V$DATAGUARD_PROCESS의 프로세스 이름과 PID는 문서 예시로 확인하지 못했습니다. 실습 화면에 ⓘ 줄로 알립니다. 적용을 다시 켜면 실습에서는 지연이 바로 0이 됩니다.

### 11단계 · RAC 기초 (2노드 클러스터 racnode1·racnode2)

결제 DB(PAYDB)를 두 서버의 인스턴스 PAYDB1·PAYDB2가 함께 여는 Oracle RAC 19c 상황입니다. Grid 홈은 `/u01/app/19.0.0/grid`, 서비스는 `pay_oltp`(두 인스턴스 모두 preferred)와 `pay_batch`(PAYDB2 preferred, PAYDB1 available)입니다.

| 레슨 | 내용 | 주요 명령 |
|---|---|---|
| 1 | RAC 클러스터 상태 점검 | `which srvctl crsctl`, `olsnodes -n -s`, `crsctl check cluster -all`, `crsctl stat res -t`, `srvctl status/config database -db paydb`, `gv$instance`와 `v$instance` 비교 |
| 2 | 서비스를 옮기고 인스턴스 하나 내리기 | `srvctl status/config service`, `srvctl relocate service -db paydb -service pay_batch -oldinst PAYDB2 -newinst PAYDB1`, `gv$session` 집계, `srvctl stop instance -db paydb -instance PAYDB2 -stopoption immediate` |
| 3 | 졸업 미션: 노드 장애 뒤 서비스 되돌리기 | `srvctl status service`, `gv$session`의 gc 대기 이벤트, 서비스를 PAYDB2로 되돌리고 확인, 보고서 |

- 근거: Real Application Clusters Administration and Deployment Guide 19c(SRVCTL 명령, 서비스의 preferred·available, GV$ 뷰, Cache Fusion 대기 이벤트), Clusterware Administration and Deployment Guide 19c(CRSCTL, OLSNODES, crsctl check cluster -all 예시), Database Reference 19c(GV$ 뷰와 INST_ID, gc 대기 이벤트). `crsctl stat res -t` 표의 구조는 21c Private Cloud Appliance 문서의 예시로 확인했습니다.
- 확인하지 못한 것: srvctl status·config 줄의 정확한 문구, crsctl 표의 열 간격과 서비스 자원 이름, check crs·activeversion 문구, 실패할 때의 PRC·PRK 오류 번호(지어내지 않고 ⓘ 안내로 바꿨습니다). 실습은 서비스가 원래 인스턴스로 자동으로 돌아가지 않는다는 문서 설명을 따릅니다. 이름, IP, 세션 수와 시각은 설명용 예시입니다.

- SQL*Plus 안에는 실습에 필요한 만큼의 작은 SQL 엔진(SELECT의 조인·외부 조인·하위 질의, WHERE, GROUP BY, HAVING, ORDER BY, 집계 함수, 4단계 STUDY 스키마의 INSERT·UPDATE·DELETE·COMMIT·ROLLBACK, 몇 가지 DDL)과 SQL*Plus 형식의 출력(LINESIZE, PAGESIZE, FEEDBACK, COLUMN FORMAT)이 들어 있습니다.
- 절차와 해설은 Oracle Database 19c 공식 문서를 기준으로 했고, 레슨마다 근거 링크를 붙였습니다. 공식 문서 예시로 확인한 출력과 확인하지 못한 출력은 페이지 아래쪽에 나누어 적었고, 확인하지 못한 출력은 터미널에도 ⓘ 줄로 알려 줍니다.
- 진행 상황은 리눅스 실습실과 따로 브라우저에 저장됩니다(`ohb:dba:done`).

## 힌트의 실무 메모 (`tips.js`)

- 힌트를 열면 명령 아래에 주석(리눅스·RMAN은 `#`, SQL은 `--`)으로 그 명령의 옵션을 찾아보는 방법과 현장에서 자주 덧붙이는 옵션이 나옵니다. 예: `set linesize 200` 아래에 `HELP SET`, `SHOW ALL`, `grep ORA- ...` 아래에 `grep --help`, `man grep`, `> 파일`, `| tee 파일`.
- 주석에 나온 찾아보기 명령은 가상 터미널에서도 동작합니다.
  - 리눅스: `man 명령`, `명령 --help`, `help 내장명령`(cd, echo, export, umask, source), `tee [-a]`, `sort [-n|-h|-r]`
  - SQL*Plus: `HELP INDEX`, `HELP 명령`, `SHOW ALL`, `SPOOL 파일 [CREATE|REPLACE|APPEND]`, `SPOOL OFF`, `SPOOL`(상태)
  - RMAN: `rman target / log 파일 [append]` (결과를 화면 대신 파일에 기록)
  - lsnrctl: `lsnrctl help`
- man, --help, HELP 화면은 실습용 한국어 요약입니다. SQL*Plus HELP의 형식 줄(`SET LIN[ESIZE] {80 | n | WINDOW}`, `SPO[OL] [file_name[.ext] [CRE[ATE] | REP[LACE] | APP[END]] | OFF | OUT]` 등)은 SQL*Plus User's Guide 19c의 표기를 옮겼습니다. RMAN LOG 동작(출력은 파일로, 입력은 화면에)은 Backup and Recovery Reference 19c의 RMAN 명령 설명을 따랐습니다. SHOW ALL 줄 형식, SPOOL 상태 문구와 오류 문구는 확인하지 못해 터미널에 ⓘ 줄로 알려 줍니다.

## 실습 세션 자동 저장 (`session.js`, `sw.js`)

- 리눅스 실습실과 DBA 실습은 지금 하던 레슨을 브라우저(localStorage `ohb:lab:sess`, `ohb:dba:sess`)에 자동 저장합니다. 새로고침해도 터미널 화면, 명령 기록, 가상 서버 상태, vi 편집 중인 내용, 할 일 진행, 열어 둔 힌트가 그대로 돌아옵니다.
- 화면을 통째로 저장하지 않고, 레슨을 시작한 시각과 난수 씨앗, 그 뒤의 입력(Enter, Tab, Ctrl+C, vi 키)을 시각과 함께 적어 둡니다. 다시 열면 같은 시각·같은 난수로 레슨을 만들고 입력을 그때 시각대로 다시 실행합니다.
- **강력 새로고침을 하면 저장한 세션을 지우고 처음부터 시작합니다.** 단축키는 Ctrl+F5, Shift+F5, Ctrl+Shift+R, 맥 크롬·파이어폭스는 Cmd+Shift+R, 맥 사파리는 Option+Cmd+R입니다. 두 가지 신호로 알아봅니다. (1) 페이지가 받은 강력 새로고침 단축키를 기억해 두었다가 다음 로드에서 확인합니다. (2) 요청을 가로채지 않는 빈 서비스 워커(`sw.js`)를 두고 "새로고침인데 서비스 워커가 페이지를 맡지 않았다"를 봅니다. 툴바의 Shift+클릭 새로고침은 (2)로만 잡힙니다. 자동 시험은 Chromium에서만 했습니다. 휴대폰처럼 강력 새로고침이 없는 곳에서는 "레슨 다시 시작"을 누르면 됩니다.
- 레슨 완료 표시(`ohb:*:done`)는 강력 새로고침으로 지우지 않습니다.

## 구현

- **외부 라이브러리 없이** HTML, CSS, JavaScript 파일 하나로 동작합니다.
- **아이소메트릭 다이어그램은 SVG로 그립니다.** 격자 좌표를 화면 좌표로 바꾸는 변환, 상자와 원통 그리기, 연결선을 따라 움직이는 흐름 애니메이션(`requestAnimationFrame`, `getPointAtLength`)으로 구성됩니다.
- **레슨은 데이터입니다.** `LESSON` 객체에 영역, 구성 요소, 연결선, 단계별 상태(보일 요소, 흐름, 태그, 지표, 콘솔)를 적으면 엔진이 그립니다. 새 레슨은 엔진을 고치지 않고 데이터만 추가합니다.
- 단계별 주소(`#step-6`), 키보드 조작(←/→, Space, R), 다크 모드, 모바일 화면, 움직임 줄이기 설정을 지원합니다.

## 로컬에서 보기

`index.html`을 브라우저로 열면 됩니다. 또는:

```bash
python3 -m http.server 8000
```

## 로드맵

- 레슨 추가: 인스턴스와 데이터베이스(STARTUP 단계), SQL 처리와 메모리 구조
- DBA 실습 다음 후보: Data Guard 페일오버와 복원(REINSTATE), RMAN으로 대기 DB 만들기
- Oracle Database 19c 실습 환경에서 수치를 측정해 예시 값을 실측값으로 교체하고, 검증 스크립트와 결과를 저장소에 기록

## 만든 사람

김영조 · [ambrokim@gmail.com](mailto:ambrokim@gmail.com)

## 참고

- 설명은 Oracle Database 19c 기준입니다. 현재 화면의 SCN, 블록 번호, 시간 수치는 설명용 예시 값입니다.
- 이 프로젝트는 Oracle Corporation 및 그 계열사와 관련이 없으며, 후원이나 승인을 받지 않았습니다. Oracle과 Java는 Oracle 및 그 계열사의 등록상표입니다.
