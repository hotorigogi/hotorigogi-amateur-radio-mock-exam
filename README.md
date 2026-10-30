# 아마추어무선기사 연습프로그램

HLØB · 25학번 장영수

아마추어무선기사 1급·3급 전화급을 준비하는 오프라인 문제풀이 프로그램입니다.

## 다운로드

**[앱 다운로드 페이지 열기](https://github.com/hotorigogi/hotorigogi-amateur-radio-mock-exam/releases/latest)**

- **[Android APK 다운로드](https://github.com/hotorigogi/hotorigogi-amateur-radio-mock-exam/releases/latest/download/RadioStudy-Android-1.0.0.apk)** — 갤럭시 등 Android 8.0 이상. 최신 System WebView를 권장합니다.
- **[Windows 64비트 ZIP 다운로드](https://github.com/hotorigogi/hotorigogi-amateur-radio-mock-exam/releases/latest/download/RadioStudy-Windows-x64.zip)** — 전체 압축을 새 폴더에 풀고 RadioStudy/RadioStudy.exe를 실행하세요.

GitHub 계정 없이도 내려받을 수 있습니다. Source code ZIP은 개발용 소스이며, 앱 실행에는 위 APK 또는 Windows ZIP을 사용하세요.

## 기능

- 동일한 통합 문제은행 1,834문항, 자동채점 및 제출 후 해설
- 1급 모의고사: 90문항 / 90분. 전파법규20·통신보안10·전파공학20·영어20·무선통신술20.
- 3급 전화급 모의고사: 50문항 / 50분. 전파법규20·통신보안10·무선설비 취급방법20.
- 모든 과목 40점 이상, 과목별 점수의 산술평균 60점 이상이면 합격
- 과목별 연습, 오답 복습, 북마크, 과목별 성적
- 기기별 기록 저장 및 JSON 기록 가져오기·내보내기

## 자료와 기록 안내

공식 시험기관의 앱이 아닌 학습 보조용 프로그램입니다. 3급 통신보안은 1급 자료를 공유하므로 실제 시험의 난이도·출제 분포와 다를 수 있습니다. 과거 법규는 문항에 표시한 시행본 기준이며 일부 문항은 원문 답안을 채택했습니다. 앱에서 해당 사실과 수정 이력을 확인할 수 있습니다. 전신급 및 모스 청음 시험은 재현하지 않습니다.

풀이 기록은 각 PC·휴대폰에 저장됩니다. 자동 동기화하지 않으며 기록 JSON 파일로 옮길 수 있습니다. 앱 삭제나 데이터 삭제 전에 기록을 내보내세요. 모의고사 시간은 앱을 닫아도 계속 흐릅니다.

## 실행 안내와 검증

Windows 앱은 공인 코드서명 인증서로 서명하지 않아 보안 정책에 따라 차단될 수 있습니다. Android APK는 앱 전용 키로 서명했으며 직접 배포 APK에 대한 설치 출처 확인이 나올 수 있습니다.

기존 데이터·채점 검사 21개와 APK 빌드·서명 검사를 통과했습니다. 모바일 폭 브라우저에서 기능을 확인했습니다. 실제 Android 기기 설치·네이티브 파일 입출력은 아직 검증하지 못했습니다.

## 소스와 빌드

- windows/: Electron 기반 Windows 앱. npm ci 후 npm run build:win 또는 BUILD_WINDOWS.cmd를 사용합니다.
- android/: Android WebView 앱. Java 17+와 Android SDK 36 / Build Tools 36.0.0을 준비하고 bash build.sh로 빌드합니다.
- 문제은행: windows/ui/questions.json 및 android/app/src/main/assets/questions.json. 문제 수정 시 두 파일을 함께 갱신하세요.

자세한 내용은 각 폴더의 README_KO.txt를 참고하세요. Android 빌드에는 별도 보관한 서명키와 암호를 로컬 private-signing 폴더에 준비해야 합니다. 서명키·암호·개인 풀이 기록은 저장소에 포함하지 않습니다.
