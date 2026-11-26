# 수정 가이드

## 사용 기술

이 앱은 **HTML/CSS/JavaScript 화면을 Android WebView에 띄우고 Java로 기기 기능을 연결한 Android 앱**입니다. Flutter나 React Native 프로젝트가 아닙니다.

- HTML: 화면의 기본 틀.
- CSS: 둥근 모서리, 색상, 배치, 버튼 터치 효과, 시작/중지 애니메이션.
- JavaScript: 화면 전환, 캘린더, 로그 목록/편집, 웹 화면의 상태 갱신.
- Java / Android SDK: 앱 실행, 안전 영역, 알림 권한과 알림 버튼, 네이티브 측정 및 저장.
- SharedPreferences: 기기 내부에 JSON 문자열로 기록 저장. 서버나 계정은 없습니다.
- Android Notification: 경과 시간을 표시하는 시스템 크로노미터와 버튼 제공.

## 파일별 역할

| 파일 | 수정할 내용 |
| --- | --- |
| `assets/index.html` | HTML 진입점, CSS/JS 로딩 |
| `assets/style.css` | 디자인과 애니메이션. 하단 규칙이 앞선 규칙을 덮어쓰는 경우가 있으므로 같은 선택자를 함께 검색 |
| `assets/app.js` | `home`, `calendar`, `day`, `editor` 화면 및 버튼 이벤트. `refreshFromDevice`는 알림에서 변경된 상태를 화면에 반영 |
| `assets/core.js` | 날짜별 합산, 시간 중복 검사, 표시 형식, 브라우저 테스트용 시작/중지 보조 로직 |
| `src/com/study/timer/MainActivity.java` | WebView 생성, 상태바/내비게이션 영역 처리, 알림 권한, JavaScript↔Java 연결 |
| `src/com/study/timer/TimerState.java` | Android의 실제 시작/중지 규칙. 2초 미만 제외, 중복 명령 방지 |
| `src/com/study/timer/TimerStore.java` | 기록 읽기/저장, 동시 변경 및 오래된 화면의 덮어쓰기 방지 |
| `src/com/study/timer/TimerNotification.java` | 알림 제목, 경과 시간, 공부 시작·휴식 시작·측정 중지 버튼 |
| `src/com/study/timer/TimerActionReceiver.java` | 알림 버튼의 명령을 받아 네이티브 측정 로직 실행 |
| `res/drawable/` | 앱 아이콘과 알림 아이콘 |
| `AndroidManifest.xml` | 앱 이름, 권한, 버전, Activity/Receiver 선언 |
| `tests/` | JS 시간 처리 검사와 Java 네이티브 측정 검사 |

## 데이터가 흐르는 방식

앱 시작/중지 버튼 → `DeviceStore.act()` → `TimerStore` → `TimerState` → 저장 및 알림 갱신.

알림 버튼 → `TimerActionReceiver` → 같은 `TimerStore` / `TimerState` → 저장 및 알림 갱신.

Java 저장소가 변경되면 앱이 실행 중일 때 `refreshFromDevice()`가 화면을 갱신합니다. 앱을 다시 열 때도 저장된 상태를 읽습니다. 측정 시간은 반복해서 초를 저장하는 방식이 아니라 시작 시각과 현재 시각의 차이로 계산합니다.

로그 수정·삭제는 웹 화면에서 수행한 뒤 `DeviceStore.write()`로 저장합니다. 기존 데이터와 일치하는지 확인하고 저장하므로, 그 사이 알림 버튼으로 바뀐 측정 상태를 오래된 편집 화면이 덮어쓰지 않습니다.

저장 구조:

```json
{
  "logs": [{"id": "고유값", "type": "study", "start": 1800000000000, "end": 1800002100000, "note": "메모"}],
  "active": null,
  "rev": 1
}
```

`start`와 `end`는 밀리초 단위 시각입니다. 측정 중이면 `active`에 `id`, `type`, `start`가 들어갑니다. `type`은 `study` 또는 `rest`입니다.

## 자주 수정할 곳

- 색상: `style.css` 맨 위 `:root`의 `--green`, `--bg`, `--ink` 등.
- 선택 버튼 이동량/속도: `style.css` 끝의 `.home>.segment`, `.home.running>.segment`, `transition`.
- 회색 문구 등장 순서: `.home.running>.started`, `.home.running>.hint`의 `transition-delay`.
- 알림 문구/버튼: `TimerNotification.java`.
- 짧은 기록 기준: Android는 `TimerState.java`의 `now-start<2000`, 웹 검증은 `core.js`의 `MIN_DURATION`. 두 곳을 일치시켜야 합니다.

## 수정 후 실행

디자인만 빠르게 확인하려면 `assets/index.html`을 PC 브라우저에서 엽니다. 이 경우 Android 알림/권한은 없고, 기록은 브라우저의 localStorage에 별도로 저장됩니다.

휴대폰용 APK 재생성:

1. VS Code 등으로 소스 폴더를 열고 수정합니다.
2. 기존 Windows PC에서 `Build-App.cmd`를 실행합니다. 소스 컴파일부터 서명까지 수행합니다.
3. 생성된 `StudyTimer_v0.6.apk`를 기존 앱 위에 설치합니다.

필요 도구는 JDK, Android SDK build-tools 36.1.0, platform android-36.1입니다. 이 프로젝트는 Gradle/Android Studio 전용 프로젝트가 아니라 SDK 도구를 직접 호출하는 작은 프로젝트입니다.

SDK 또는 기존 서명키 경로가 다르면 PowerShell에서:

```powershell
.\Build-All.ps1 -Sdk "C:\경로\Android\Sdk" -KeyStore "C:\경로\prototype.keystore"
```

기본 서명키 위치는 이전 작업 폴더인 `%USERPROFILE%\Documents\Codex\2026-11-24\new-chat-2\study-timer\build\prototype.keystore`입니다. 서명키는 소스 압축 파일에 포함하지 않았습니다. 기존 앱의 기록을 유지하며 업데이트하려면 같은 키를 사용해야 합니다.

`Build-App.cmd`와 `Build-Update.cmd`는 모두 소스 빌드와 서명을 수행합니다. `Sign-Update.ps1`만 실행하면 이미 빌드된 unsigned APK의 서명만 수행합니다.

배포 버전을 새로 구분하려면 Manifest의 `versionCode`를 올리고 `versionName`을 변경합니다. 파일명 변경은 빌드/서명 스크립트에도 반영하세요.

## 검증과 한계

- 기존 JS 시간·합산·중복·삭제 테스트 통과.
- 네이티브 시작/중지 테스트 195개는 이전 구현 단계에서 통과.
- 이번 Windows 빌드에서 Java 컴파일, APK 서명 및 기존 인증서 일치 확인.
- 실제 Android 기기의 알림 표시/권한/버튼 조작은 아직 미검증입니다.

JS 검사: `node tests/core.test.js`, `node tests/record-actions.test.js`.
Java 테스트는 `TimerState.java`와 `tests/java/TimerStateTest.java`를 JVM에서 실행하며, 별도의 org.json 실행 라이브러리가 필요합니다. SDK의 android.jar는 테스트 실행용 구현체가 아닙니다.
