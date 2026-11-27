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
    crsctl: ['Clusterware Administration and Deployment Guide 19c · CRSCTL', D19 + 'cwadd/oracle-clusterware-control-crsctl-utility-reference.html'],
    olsnodes: ['Clusterware Administration and Deployment Guide 19c · OLSNODES', D19 + 'cwadd/olsnodes-command-reference.html'],
    srvctl: ['RAC Administration and Deployment Guide 19c · SRVCTL', D19 + 'racad/server-control-utility-reference.html'],
    haovw: ['High Availability Overview 19c · Planned Maintenance Command Examples', D19 + 'haovw/server-side-planned-maintenance-command-examples.html'],
    cwsrv: ['Clusterware Administration and Deployment Guide 19c · SRVCTL (ASM)', D19 + 'cwadd/server-control-command-reference.html'],
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
    dgbrkcmd: ['Data Guard Broker 19c · Broker Commands', D19 + 'dgbkr/oracle-data-guard-broker-commands.html'],
    dgbrkex: ['Data Guard Broker 19c · Examples Using DGMGRL', D19 + 'dgbkr/examples-using-data-guard-broker-DGMGRL-utility.html'],
    dgstats: ['Database Reference 19c · V$DATAGUARD_STATS', D19 + 'refrn/V-DATAGUARD_STATS.html'],
    dgproc: ['Database Reference 19c · V$DATAGUARD_PROCESS', D19 + 'refrn/V-DATAGUARD_PROCESS.html'],
    tgxplan: ['SQL Tuning Guide 19c · Generating and Displaying Execution Plans', D19 + 'tgsql/generating-and-displaying-execution-plans.html'],
    xplan: ['PL/SQL Packages 19c · DBMS_XPLAN', D19 + 'arpls/DBMS_XPLAN.html'],
    crindex: ['SQL Language Reference 19c · CREATE INDEX', D19 + 'sqlrf/CREATE-INDEX.html'],
    tgstats: ['SQL Tuning Guide 19c · Gathering Optimizer Statistics', D19 + 'tgsql/gathering-optimizer-statistics.html'],
    maint: ['Backup and Recovery User\'s Guide 19c · Maintaining RMAN Backups', D19 + 'bradv/maintaining-rman-backups.html'],
    coreutils: ['GNU Coreutils manual', 'https://www.gnu.org/software/coreutils/manual/coreutils.html'],
  };

  /* ---------- 리눅스 명령 요약: man, --help, 힌트 주석에 함께 쓴다 ---------- */
  const REF = {
    grep: { d: 'Search files or input for lines containing a pattern.', syn: 'grep [OPTION] PATTERN [FILE...]', o: [['-i', 'Ignore case'], ['-n', 'Show line numbers too'], ['-c', 'Show only the number of matching lines'], ['-v', 'Show only lines without the pattern'], ['-l', 'Show only the names of matching files'], ['-A N / -B N / -C N', 'Also show N lines after / before / around each match'], ['-E', "Extended regular expressions (e.g. grep -E 'ORA-|TNS-' file)"]],
      tip: ['# Common combinations: grep -n ORA- file (line numbers), grep -c ORA- file (count), grep -A3 ORA- file (up to 3 lines after)', '# Save results to a file: grep ORA- file > ~/ora_errors.txt (overwrite), >> (append), | tee ~/ora_errors.txt (screen and file)'] },
    ls: { d: 'Show directory contents.', syn: 'ls [OPTION] [FILE...]', o: [['-l', 'Long listing (permissions, owner, size, time)'], ['-a', 'Include hidden files starting with .'], ['-h', 'With -l, show sizes as K, M, G'], ['-t', 'Sort by modification time, newest first'], ['-r', 'Reverse the order'], ['-d', 'The directory itself, not its contents']],
      tip: ['# Common combinations: ls -ltr (most recently changed file at the bottom), ls -lh (readable sizes), ls -la (include hidden files)'] },
    cat: { d: 'Print file contents as they are.', syn: 'cat [OPTION] [FILE...]', o: [['-n', 'Number the output lines']],
      tip: ['# For long files use less file (search with /word, n next, q quit); to see only the start or end, head -20 file, tail -50 file'] },
    less: { d: 'Page through a long file one screen at a time.', syn: 'less [FILE]', o: [['/word', 'Search forward (n next, N previous)'], ['G / g', 'End / beginning'], ['q', 'Quit']], tip: ['# Open large logs with less instead of cat and search with /ORA-'] },
    head: { d: 'Print the first part of a file.', syn: 'head [OPTION] [FILE...]', o: [['-n N', 'First N lines (default 10)']], tip: ['# head -n 30 file (first 30 lines)'] },
    tail: { d: 'Print the last part of a file.', syn: 'tail [OPTION] [FILE...]', o: [['-n N', 'Last N lines (default 10); the short form tail -50 also works'], ['-f', 'Keep showing new lines as they are added to the file (end with Ctrl+C)']],
      tip: ['# Watch the alert log live: tail -f alert_ORCL.log (end with Ctrl+C)', '# Save only recent errors: tail -500 alert_ORCL.log | grep ORA- > ~/recent_ora.txt'] },
    find: { d: 'Find files that match conditions.', syn: 'find [PATH...] [EXPRESSION]', o: [['-name "*.log"', 'By name (wrap in quotes)'], ['-iname', 'By name, ignoring case'], ['-type f / d', 'Files only / directories only'], ['-mtime +7', 'Files older than 7 days (real server)'], ['-size +1G', 'Files larger than 1 GB (real server)']],
      tip: ['# Hide permission error lines: find / -name "*.ora" 2>/dev/null', '# Conditions often used on real servers: -mtime +7 (files older than 7 days), -size +1G (files larger than 1 GB)'] },
    df: { d: 'Show usage per file system.', syn: 'df [OPTION] [PATH...]', o: [['-h', 'Human-readable K, M, G units'], ['PATH', 'Only the file system holding that path (e.g. df -h /u01)']],
      tip: ['# Keep a check record: df -h > ~/df_check.txt'] },
    du: { d: 'Show the space used by directories and files.', syn: 'du [OPTION] [PATH...]', o: [['-s', 'Total only'], ['-h', 'Human-readable units']],
      tip: ['# What is large: du -sh /u01/app/oracle/* | sort -h (smallest first, largest at the bottom)'] },
    free: { d: 'Show memory and swap usage.', syn: 'free [OPTION]', o: [['-h', 'Human-readable units'], ['-m / -g', 'In MB / GB']], tip: ['# In free -h, the available column is the memory that can actually still be used'] },
    ps: { d: 'Show running processes.', syn: 'ps [OPTION]', o: [['-e', 'All processes'], ['-f', 'Full format (UID, PID, PPID, start time, command)']],
      tip: ['# Common combinations: ps -ef | grep pmon (is the instance up), ps -ef | grep tnslsnr (listener)'] },
    kill: { d: 'Send a signal to processes.', syn: 'kill [-SIGNAL] PID...', o: [['(no signal)', 'TERM: request a normal shutdown'], ['-9', 'KILL: force kill (last resort)']], tip: ['# Do not kill Oracle background processes (pmon, smon, etc.). Clean up sessions with ALTER SYSTEM KILL SESSION'] },
    chmod: { d: 'Change file permissions.', syn: 'chmod [OPTION] MODE FILE...', o: [['755', 'Sum of r=4 w=2 x=1 (owner/group/others)'], ['u+x', 'Add execute permission for the owner'], ['-R', 'Including subdirectories']], tip: ['# Reading the numbers: r=4 w=2 x=1 → 755 = rwxr-xr-x, 640 = rw-r-----'] },
    chown: { d: 'Change file owner and group.', syn: 'chown [OPTION] USER[:GROUP] FILE...', o: [['-R', 'Including subdirectories']], tip: ['# Oracle directories are usually chown -R oracle:oinstall PATH'] },
    mkdir: { d: 'Create directories.', syn: 'mkdir [OPTION] DIRECTORY...', o: [['-p', 'Create parent directories as needed; no error if it already exists']], tip: ['# Use -p to create the whole path at once, as in mkdir -p /u01/app/oracle'] },
    cp: { d: 'Copy files.', syn: 'cp [OPTION] SOURCE DEST', o: [['-p', 'Preserve permissions and times'], ['-r', 'Copy whole directories']], tip: ['# Back up before editing a configuration file: cp -p file file.bak'] },
    mv: { d: 'Move or rename files.', syn: 'mv [OPTION] SOURCE DEST', o: [['-i', 'Ask before overwriting']], tip: [] },
    rm: { d: 'Remove files.', syn: 'rm [OPTION] FILE...', o: [['-i', 'Ask before every removal'], ['-r', 'Whole directories (careful)'], ['-f', 'Without asking (careful)']], tip: ['# Check the target with ls -l before removing. Never remove Oracle data files with rm'] },
    uname: { d: 'Show system information.', syn: 'uname [OPTION]', o: [['-a', 'Everything'], ['-r', 'Kernel version'], ['-m', 'Hardware type (x86_64)']], tip: [] },
    id: { d: 'Show user and group information.', syn: 'id [USER]', o: [['USER', 'That user\'s UID, GID, and groups (e.g. id oracle)']], tip: ['# Check another account too: id oracle'] },
    vmstat: { d: 'Summarize memory, CPU, and I/O status.', syn: 'vmstat [DELAY [COUNT]]', o: [['2 5', '5 times at 2-second intervals']], tip: ['# On real servers, take several samples like vmstat 2 5 to see the trend (r: waiting to run, si/so: swap in/out)'] },
    top: { d: 'Show processes in real time.', syn: 'top', o: [['P / M', 'Sort by CPU / by memory (real server)'], ['q', 'Quit']], tip: ['# Inside top, P sorts by CPU, M by memory, q quits'] },
    sysctl: { d: 'View and change kernel parameters.', syn: 'sysctl [OPTION] [NAME[=VALUE]]', o: [['-a', 'All values'], ['-p [FILE]', 'Apply the values written in a file'], ['--system', 'Apply all files in /etc/sysctl.d']], tip: ['# Find a current value: sysctl -a | grep shm', '# Record values before changing them: sysctl -a > ~/sysctl_before.txt'] },
    rpm: { d: 'Query RPM packages.', syn: 'rpm -q [OPTION] [PACKAGE]', o: [['-q NAME', 'Installed or not, and the version'], ['-qa', 'All installed packages'], ['-qi NAME', 'Detailed information (real server)']], tip: ['# Check installation in one go: rpm -qa | grep NAME'] },
    dnf: { d: 'Install and query packages (Oracle Linux 8).', syn: 'dnf [COMMAND] [PACKAGE]', o: [['install NAME', 'Install'], ['info NAME', 'Information (real server)'], ['list installed', 'Installed list (real server)']], tip: ['# rpm -q NAME is the quick way to check installation. dnf info NAME and dnf list installed are used on real servers'] },
    ulimit: { d: 'Show the resource limits of the current shell.', syn: 'ulimit [OPTION]', o: [['-a', 'Everything'], ['-Sn / -Hn', 'Soft / hard limit on open files'], ['-Su / -Hu', 'Soft / hard limit on processes']], tip: ['# Log in as the oracle user to check: ulimit -Sn; ulimit -Hn'] },
    ss: { d: 'Show socket (network connection) status.', syn: 'ss [OPTION]', o: [['-l', 'Listening sockets'], ['-n', 'Numbers instead of names'], ['-t', 'TCP'], ['-p', 'Processes']], tip: ['# Check the listener port: ss -lnt | grep 1521'] },
    env: { d: 'Show environment variables.', syn: 'env', o: [], tip: ['# To see just one: echo $ORACLE_SID'] },
    tee: { d: 'Show input on screen while also writing it to a file.', syn: 'COMMAND | tee [OPTION] FILE', o: [['-a', 'Append to the end of the file instead of overwriting']], tip: [] },
    sort: { d: 'Sort lines.', syn: 'sort [OPTION] [FILE]', o: [['-n', 'By numeric value'], ['-h', 'By sizes such as 1K, 2M, 3G'], ['-r', 'Reverse']], tip: [] },
    man: { d: 'Show the manual for a command.', syn: 'man COMMAND', o: [], tip: [] },
    vi: { d: 'Edit a file.', syn: 'vi FILE', o: [['i', 'Insert mode'], ['Esc', 'To command mode'], [':wq', 'Save and quit'], [':q!', 'Quit without saving'], ['/word', 'Search (real server)']], tip: ['# Backing up with cp -p file file.bak before changing it makes it easy to undo'] },
    useradd: { d: 'Create a user.', syn: 'useradd [OPTION] USER', o: [['-u UID', 'Set the UID'], ['-g GROUP', 'Primary group'], ['-G GROUP,...', 'Secondary groups']], tip: ['# After creating, check the groups with id USER'] },
    groupadd: { d: 'Create a group.', syn: 'groupadd [OPTION] GROUP', o: [['-g GID', 'Set the GID']], tip: ['# Check: grep GROUPNAME /etc/group'] },
    usermod: { d: 'Change user information.', syn: 'usermod [OPTION] USER', o: [['-aG GROUP', 'Add secondary groups (using -G without -a replaces the existing secondary groups)']], tip: ['# Add secondary groups with -aG (without a, the existing groups disappear)'] },
    cd: { b: 1, d: 'Change the working directory (bash builtin).', syn: 'cd [DIRECTORY]', o: [['(none) / ~', 'To the home directory'], ['-', 'To the previous directory'], ['..', 'Up one level']], tip: ['# cd - goes to the previous directory, cd alone goes home. Check with pwd after moving'] },
    pwd: { b: 1, d: 'Show the full path of the current directory.', syn: 'pwd', o: [], tip: [] },
    umask: { b: 1, d: 'Show or set the value subtracted from the default permissions of new files (bash builtin).', syn: 'umask [VALUE]', o: [['-S', 'As letters, like u=rwx,g=rx,o=rx']], tip: ['# umask 022 → new files 644, new directories 755. The oracle user is usually 022'] },
    echo: { b: 1, d: 'Print text or variable values (bash builtin).', syn: 'echo [TEXT...]', o: [['$VARIABLE', 'Value of an environment variable (e.g. echo $ORACLE_SID)']], tip: ['# > writes the file anew (overwrite), >> appends to the end. Collecting check records with >> keeps a history', '# Record the time too: date >> ~/report.txt'] },
    export: { b: 1, d: 'Create an environment variable and pass it to child processes (bash builtin).', syn: 'export NAME=VALUE', o: [], tip: ['# Check: echo $NAME or env | grep NAME. To set it at every login, write it in ~/.bash_profile'] },
    source: { b: 1, d: 'Run the commands in a file in the current shell (bash builtin, same as .).', syn: 'source FILE', o: [], tip: ['# After editing .bash_profile, run source ~/.bash_profile or log in again for it to take effect'] },
    which: { d: 'Show which file in PATH a command runs from.', syn: 'which COMMAND', o: [], tip: ['# Use it to check which one runs when a command with the same name exists in several places'] },
    whoami: { d: 'Show the current user name.', syn: 'whoami', o: [], tip: ['# More detail: id (including UID and groups)'] },
    hostname: { d: 'Show the server name.', syn: 'hostname', o: [], tip: [] },
    touch: { d: 'Create an empty file or change a file\'s times.', syn: 'touch FILE...', o: [], tip: ['# Often used to test write permission. After creating, check the owner and permissions with ls -l'] },
    su: { d: 'Switch to another user.', syn: 'su [-] [USER]', o: [['-', 'Also read that user\'s login environment (.bash_profile)']], tip: ['# Add -, as in su - oracle, for environment variables such as ORACLE_HOME to be set. Use exit to come back'] },
    passwd: { d: 'Change a user\'s password.', syn: 'passwd [USER]', o: [], tip: ['# The password you type is not shown on screen. Only root can change other users\' passwords'] },
    ssh: { d: 'Connect to another server.', syn: 'ssh USER@SERVER', o: [], tip: ['# A server you connect to for the first time asks you to confirm its host key (yes). Use exit to finish'] },
    lsblk: { d: 'List block devices (disks).', syn: 'lsblk', o: [], tip: [] },
    unzip: { d: 'Extract zip archives.', syn: 'unzip [OPTION] FILE.zip [-d DIRECTORY]', o: [['-q', 'Do not list the files being extracted'], ['-d DIRECTORY', 'Extract into that directory (otherwise the current directory)'], ['-l', 'List only, without extracting (real server)'], ['-o', 'Overwrite without asking (careful)']], tip: ['# List before extracting: unzip -l file.zip (real server). Keeping the Oracle patch zip exactly as downloaded lets you extract it again'] },
  };
  REF.more = REF.less; REF.vim = REF.vi; REF.yum = REF.dnf; REF.printenv = REF.env;

  /* ---------- 오라클 명령 주석 ---------- */
  const ORA = [
    // [정규식(줄 맨 앞, 대문자로 비교), 맥락, 주석 줄, 근거]
    [/^I\s+→/, 'sh', ['# vi: i insert mode, Esc command mode, :wq save and quit, :q! quit without saving', '# Backing up with cp -p file file.bak before editing makes it easy to undo'], []],
    [/^SQLPLUS\b/, 'sh', ['# After connecting, HELP INDEX lists SQL*Plus commands and HELP command_name shows the syntax'], ['help']],
    [/^LSNRCTL\b/, 'sh', ['# Command list: lsnrctl help (at the LSNRCTL> prompt, HELP command_name shows one command\'s syntax)', '# Keep a check record: lsnrctl status > ~/lsnr_status.txt'], ['lsnrctl']],
    [/^RMAN\b/, 'sh', ['# Log the work to a file: rman target / log /home/oracle/rman.log (output goes to the file instead of the screen; add append at the end to append)', '# Both screen and file: rman | tee rman.log (method shown in the documentation, real server)'], ['rman', 'rmantrb']],
    [/^SET\s+(LIN|PAGES|FEED|HEA|NUMW|TIMI|TRIMS)/, 'sql', ['-- All SET options and their syntax: HELP SET', '-- See current settings: SHOW ALL, just one: SHOW LINESIZE', '-- Defaults are LINESIZE 80 and PAGESIZE 14 (for long results, also SET PAGESIZE 100)'], ['set', 'help', 'show']],
    [/^(COL|COLUMN)\b/, 'sql', ['-- Syntax: HELP COLUMN', '-- Clear a setting: COLUMN column_name CLEAR, clear all: CLEAR COLUMNS'], ['column', 'help']],
    [/^SHOW\s+PARAMETER/, 'sql', ['-- Part of the name is enough: SHOW PARAMETER recovery', '-- Save values to a file before changing them: SPOOL /home/oracle/param_before.txt → SHOW PARAMETER ... → SPOOL OFF'], ['show', 'spool']],
    [/^SHOW\b/, 'sql', ['-- See all settings: SHOW ALL, syntax: HELP SHOW'], ['show', 'help']],
    [/^EXPLAIN\s+PLAN\b/, 'sql', ['-- Writes only the plan to PLAN_TABLE without running the SQL. View it right after with SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);', '-- To give it a name: EXPLAIN PLAN SET STATEMENT_ID = \'before\' FOR SELECT ...'], ['tgxplan']],
    [/DBMS_XPLAN\.DISPLAY_CURSOR/, 'sql', ['-- With no arguments, it shows the plan of the last SQL this session ran', '-- Format: DISPLAY_CURSOR(sql_id, cursor_child_no, format), format defaults to TYPICAL'], ['xplan']],
    [/DBMS_XPLAN\.DISPLAY/, 'sql', ['-- More detail: DBMS_XPLAN.DISPLAY(format => \'ALL\'), shorter: \'BASIC\' (format values from the documentation)', '-- If the plan looks cut off, SET LINESIZE 200; to see it without headings, SET PAGESIZE 0', '-- Plan to a file: SPOOL /home/oracle/plan.txt → query → SPOOL OFF'], ['xplan', 'spool']],
    [/^CREATE\s+(UNIQUE\s+)?INDEX\b/, 'sql', ['-- During business hours use ONLINE (DML allowed while building). Check: SELECT index_name, status FROM user_indexes;', '-- First check whether an index starting with the same column already exists: SELECT index_name, column_name FROM dba_ind_columns WHERE table_name = \'TABLE\';'], ['crindex']],
    [/DBMS_STATS\.GATHER_TABLE_STATS/, 'sql', ['-- Documentation example: DBMS_STATS.GATHER_TABLE_STATS(ownname => \'sh\', tabname => \'customers\', degree => 2)', '-- Check the result: SELECT table_name, last_analyzed, stale_stats FROM dba_tab_statistics WHERE owner = \'APP\';'], ['tgstats']],
    [/^OLSNODES\b/, 'sh', ['# Without options only node names are shown. -n number, -s status (Active/Inactive), -t pinned (Pinned/Unpinned), -l this node only, -c cluster name'], ['olsnodes']],
    [/^\S*CRSCTL\s+(STOP|START)\s+(CRS|CLUSTER)\b/, 'sh', ['# Run as root. root\'s PATH does not include the Grid home, so use the full path: /u01/app/19.0.0/grid/bin/crsctl', '# stop crs stops only this node (including OHASD); stop cluster -n node / -all stops several nodes (OHASD stays up). Use -f only when a normal stop has failed', '# Before planned work, first shut down the DB and instances cleanly with srvctl. Check the syntax: crsctl stop cluster -help'], ['crsctl']],
    [/^\S*CRSCTL\s+(STAT|STATUS)\s+RES/, 'sh', ['# Filter operators: = != co (contains) st (starts with) en (ends with), combine with AND OR, spaces around operators (e.g. -w "TYPE = ora.database.type")', '# -init shows the lower-level resources within a node, -t shows a table. Only query ora. resources with crsctl; control them with srvctl', '# Compare before and after: crsctl stat res -t > ~/crs_before.txt, then diff after the work'], ['crsctl']],
    [/^\S*SRVCTL\s+\w+\s+(ASM|DISKGROUP|FILESYSTEM)\b/, 'sh', ['# ASM and disk groups use the Grid home\'s srvctl: $GRID_HOME/bin/srvctl (plain srvctl runs the DB home\'s one, which is earlier in PATH)', '# stop diskgroup -force does not stop the DBs on it first, so do not use it in production'], ['cwsrv']],
    [/^\S*SRVCTL\s+.*-DRAIN_TIMEOUT\b/, 'sh', ['# -drain_timeout seconds: blocks new connections and gives attached sessions time to finish. After the time, they are cleaned up the -stopoption way', '# Preview the result without changing anything: add -eval to the end of the same command (start/stop/relocate service, etc.)'], ['haovw', 'srvctl']],
    [/^\S*SRVCTL\s+(STOP|START)\s+HOME\b/, 'sh', ['# Give the -statefile created by stop home to start home as is, so that only the resources that were running are brought back', '# /tmp may be cleared at reboot, so for a long patch keep it somewhere that is not cleared'], ['srvctl']],
    [/^\S*SRVCTL\s+(STOP|START)\s+SCAN/, 'sh', ['# Stopping: scan_listener → scan; starting: scan → scan_listener. Without -scannumber, all three SCANs'], ['srvctl']],
    [/^\S*SRVCTL\s+(ENABLE|DISABLE)\b/, 'sh', ['# disable is not stop. It leaves what is running as it is and only marks it so that Clusterware does not start or manage it', '# When finished, always restore it with enable, and note "left disabled" in the work log'], ['srvctl']],
    [/^\S*CRSCTL\b/, 'sh', ['# crsctl is in the Grid home (e.g. /u01/app/19.0.0/grid/bin). First check which one runs with which crsctl', '# Save for before/after comparison: crsctl stat res -t > ~/crs_before.txt'], ['crsctl']],
    [/^\S*SRVCTL\b/, 'sh', ['# DBs, instances, and services are handled with the database home\'s srvctl (RAC 19c documentation). On success it prints nothing, so check that echo $? is 0', '# Save the configuration before changing it: srvctl config service -db paydb > ~/svc_before.txt'], ['srvctl']],
    [/^DGMGRL\b/, 'sh', ['# Inside DGMGRL, HELP lists the commands, and HELP SHOW and the like show one command\'s syntax', '# Run one line and exit: dgmgrl / "show configuration" > ~/dg_status.txt'], ['dgbrkcmd']],
    [/^SHOW\s+CONFIGURATION\b/, 'dg', ['# More detail: SHOW CONFIGURATION VERBOSE (including configuration properties)', '# Even if the summary says SUCCESS, check the standby\'s lag separately with SHOW DATABASE'], ['dgbrkex']],
    [/^SHOW\s+DATABASE\b/, 'dg', ['# More detail: SHOW DATABASE VERBOSE name (all properties)', '# Transport Lag = redo not yet received, Apply Lag = redo received but not yet applied'], ['dgbrkex']],
    [/^EDIT\s+DATABASE\b.*\bSTATE\b/, 'dg', ["# Standby state values: APPLY-ON, APPLY-OFF / primary: TRANSPORT-ON, TRANSPORT-OFF", '# Before turning it off, write in the work log why it was turned off and when it will be turned back on'], ['dgbrkex', 'dgbrkcmd']],
    [/^VALIDATE\s+DATABASE\b/, 'dg', ['# Always run this before a SWITCHOVER. Confirm Ready for Switchover: Yes', '# Save the result: dgmgrl / "validate database orclstby" > ~/validate_before.txt'], ['dgbrkcmd']],
    [/^SWITCHOVER\s+TO\b/, 'dg', ['# Switching back is the same command: SWITCHOVER TO old_primary_name', '# When the primary is suddenly lost, use FAILOVER TO, not SWITCHOVER'], ['dgbrkcmd', 'dgbrkex']],
    [/^SELECT\b.*V\$DATAGUARD_STATS/, 'sql', ['-- Query this on the standby. It has no rows on the primary (Database Reference 19c)', '-- Just one value: ... WHERE name = \'apply lag\';'], ['dgstats']],
    [/^SELECT\b.*V\$DATAGUARD_PROCESS/, 'sql', ['-- See the column list: DESC v$dataguard_process', '-- Use this view instead of the older V$MANAGED_STANDBY'], ['dgproc']],
    [/^SELECT\b.*DBA_REGISTRY_SQLPATCH/, 'sql', ['-- A row is added for every apply and rollback. ORDER BY install_id reads them in order', '-- If STATUS is not SUCCESS, open the log in the LOGFILE column'], ['regsqlp']],
    [/^SELECT\b.*\b(V\$|DBA_|GV\$)/, 'sql', ['-- Which columns exist: DESC view_name (e.g. DESC v$session)', '-- Results to a file: SPOOL /home/oracle/result.txt → query → SPOOL OFF (without an extension, .lst)', '-- If columns look cut off: SET LINESIZE 200, COLUMN column_name FORMAT a30'], ['spool', 'sqlqr']],
    [/^SELECT\b/, 'sql', ['-- Results to a file: SPOOL /home/oracle/result.txt → query → SPOOL OFF (without an extension, .lst)', '-- See a table\'s structure: DESC table_name'], ['spool', 'sqlqr']],
    [/^CONN(ECT)?\b/, 'sql', ['-- Who you are connected as: SHOW USER', '-- Syntax: HELP CONNECT'], ['help']],
    [/^ARCHIVE\s+LOG\s+LIST/, 'sql', ['-- Same information in SQL: SELECT log_mode FROM v$database;'], []],
    [/^ORAPWD\b/, 'sh', ['# After creating, check in SQL*Plus: SELECT username, sysdba FROM v$pwfile_users;'], []],
    [/^SQL\s+'/, 'rman', ["# Runs a SQL statement inside RMAN. Write the SQL statement inside single quotes"], []],
    [/^EXEC(UTE)?\b/, 'sql', ['-- EXEC is a SQL*Plus command that wraps one PL/SQL statement in BEGIN ... END; and runs it', '-- Check snapshots: SELECT snap_id, begin_interval_time FROM dba_hist_snapshot ORDER BY snap_id;'], []],
    [/^@/, 'sql', ['-- @file runs a SQL script. ? and $ORACLE_HOME stand for the Oracle home path', '-- The report file is created in the directory where sqlplus was started (check with HOST ls -lt)'], []],
    [/^(STARTUP|SHUTDOWN)\b/, 'sql', ['-- See the options: HELP STARTUP, HELP SHUTDOWN', '-- Progress is recorded in the alert log: host tail -50 /u01/app/oracle/diag/rdbms/orcl/ORCL/trace/alert_ORCL.log'], ['startup', 'help']],
    [/^ALTER\s+SYSTEM\b/, 'sql', ['-- Check the value before changing it: SHOW PARAMETER name (keeping it with SPOOL makes reverting easy)', '-- Syntax: ALTER SYSTEM in the SQL Language Reference 19c'], ['altersys']],
    [/^ALTER\s+DATABASE\b/, 'sql', ['-- Syntax: ALTER DATABASE in the SQL Language Reference 19c', '-- Check the result: SELECT status FROM v$instance; SELECT open_mode FROM v$database;'], ['alterdb']],
    [/^ALTER\s+TABLESPACE\b/, 'sql', ['-- Check: SELECT tablespace_name, status FROM dba_tablespaces;', '-- How to manage them: Managing Tablespaces in the Administrator\'s Guide 19c'], ['tbs']],
    [/^(ALTER|CREATE)\s+USER\b/, 'sql', ['-- Check: SELECT username, account_status FROM dba_users WHERE username = \'NAME\';', '-- Syntax: CREATE USER in the SQL Language Reference 19c'], ['createuser', 'users']],
    [/^GRANT\b/, 'sql', ['-- Check: SELECT * FROM dba_tab_privs WHERE grantee = \'NAME\'; (system privileges are in dba_sys_privs)', '-- Syntax: GRANT in the SQL Language Reference 19c'], ['grant']],
    [/^FLASHBACK\s+TABLE\b/, 'sql', ['-- See the recycle bin: SHOW RECYCLEBIN', '-- Syntax: FLASHBACK TABLE in the SQL Language Reference 19c'], ['flashback']],
    [/^(BACKUP)\b/, 'rman', ['# Syntax: BACKUP in the Backup and Recovery Reference 19c (RMAN has no HELP command, so see the documentation)', '# Check after backing up: LIST BACKUP SUMMARY;'], ['backup']],
    [/^(RESTORE)\b/, 'rman', ['# Syntax: RESTORE in the Backup and Recovery Reference 19c'], ['restore']],
    [/^(RECOVER)\b/, 'rman', ['# Syntax: RECOVER in the Backup and Recovery Reference 19c'], ['recover']],
    [/^(LIST)\b/, 'rman', ['# Syntax: LIST in the Backup and Recovery Reference 19c', '# To keep the results in a file, start with rman target / log /home/oracle/rman_list.log'], ['list', 'rman']],
    [/^(REPORT)\b/, 'rman', ['# Syntax: REPORT in the Backup and Recovery Reference 19c'], ['report']],
    [/^(DELETE|CROSSCHECK)\b/, 'rman', ['# Check the targets before deleting: REPORT OBSOLETE;', '# How to manage them: Maintaining RMAN Backups in the Backup and Recovery User\'s Guide 19c'], ['maint']],
    [/(^|\/)OPATCH\s+LSPATCHES\b/, 'sh', ['# Command list: opatch -help, options for one command: opatch lsinventory -help (real server)', '# Keep a record: $ORACLE_HOME/OPatch/opatch lspatches > ~/lspatches_before.txt'], ['optch']],
    [/(^|\/)OPATCH\s+LSINVENTORY\b/, 'sh', ['# OPatch is not in PATH, so run it with its path, like $ORACLE_HOME/OPatch/opatch', '# Save a copy with > file before and after patching. It is the first record a support engineer looks for when something goes wrong'], ['optch', 'opsi']],
    [/(^|\/)OPATCH\s+VERSION\b/, 'sh', ['# Compare with the minimum OPatch version required by the patch README. New OPatch is patch 6880880 (My Oracle Support Note 6880880.1)'], ['dbptc']],
    [/(^|\/)OPATCH\s+PREREQ\b/, 'sh', ['# Run it in the extracted patch directory (-ph ./). Do it by the day before the maintenance', '# Save the result: ... -ph ./ > ~/prereq_result.txt'], ['opsi']],
    [/(^|\/)OPATCH\s+(APPLY|ROLLBACK)\b/, 'sh', ['# Check before running: ps -ef | grep pmon, ps -ef | grep tnslsnr (the DB and listener of this home must all be down)', '# Progress is recorded at the Log file location shown on screen. If it fails, look at that log first', '# Preview only: opatch apply -report (changes nothing, OPatch User\'s Guide)'], ['opsi', 'optch']],
    [/(^|\/)DATAPATCH\b/, 'sh', ['# The DB must be open (startup first). Check with -sanity_checks, then apply with -verbose', '# Check the result: SELECT patch_id, action, status FROM dba_registry_sqlpatch ORDER BY install_id;', '# The log location appears on the "Log file for this invocation:" line'], ['opsi', 'regsqlp']],
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
      out.push(r.b ? `# Look it up: help ${name} (bash builtin)` : `# Look up options: ${name} --help or man ${name}`);
      out.push(...r.tip);
    }
    if (!out.length) return null;
    if (/\s>>?\s/.test(t) || /\|\s*tee\b/.test(t)) out.push('# > overwrites, >> appends, and | tee file writes to the screen and the file together');
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
    return `<div class="tips" aria-label="Field notes">${lines.map(x => `<span class="tip-line">${esc(x)}</span>`).join('\n')}${links ? `
<span class="tip-src">Source: ${links}</span>` : ''}</div>`;
  }

  /* man, --help 출력 (실습용 요약) */
  function manText(name, how) {
    const r = REF[name]; if (!r) return null;
    const w = Math.max(10, ...r.o.map(o => o[0].length));
    const body = `${how === 'man' ? `${name.toUpperCase()}(1)

NAME
    ${name} - ${r.d}

SYNOPSIS
    ${r.syn}
` : `Usage: ${r.syn}
${r.d}
`}${r.o.length ? `\n${how === 'man' ? 'Main options\n' : ''}${r.o.map(([a, b]) => `    ${a.padEnd(w)}  ${b}`).join('\n')}\n` : ''}${r.tip.length ? `\n${r.tip.map(x => x.replace(/^# /, 'In practice: ')).join('\n')}\n` : ''}`;
    return body;
  }

  window.Tips = { html, ref: (n) => REF[n] || null, manText, SRC: S };
})();
