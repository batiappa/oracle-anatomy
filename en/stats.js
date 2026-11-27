/* 방문 통계(GoatCounter). 쿠키를 쓰지 않는 방문 집계 서비스다.
   - CODE에 GoatCounter 사이트 코드(가입할 때 정한 이름, 예: mroracle)를 적으면 켜진다. 비어 있으면 아무것도 하지 않는다.
   - batiappa.github.io에서 열 때만 센다(로컬 테스트나 미리보기는 세지 않는다).
   - 집계 화면: https://<CODE>.goatcounter.com  (페이지별·나라별·유입 경로·언어별 방문 수)
   - 근거: GoatCounter 안내(https://goatcounter.com/)의 설치 코드
     <script data-goatcounter="https://<CODE>.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
   이 파일 하나만 고치면 한국어판과 영어판의 모든 페이지에 적용된다(영어판은 tools/i18n/i18n.py build가 그대로 복사한다). */
(function () {
  'use strict';
  var CODE = 'mroracle';
  if (!CODE || location.hostname !== 'batiappa.github.io') return;
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.setAttribute('data-goatcounter', 'https://' + CODE + '.goatcounter.com/count');
  document.head.appendChild(s);
})();
