# Apple Sign In Server

Flutter 앱을 위한 Apple Sign In 서버입니다.

## 환경 변수 설정

Render에서 다음 환경 변수들을 설정해야 합니다:

### 필수 환경 변수
- `BUNDLE_ID`: iOS 앱의 Bundle ID
- `SERVICE_ID`: Apple Developer 계정의 Service ID
- `TEAM_ID`: Apple Developer Team ID
- `KEY_ID`: Apple Sign In 키 ID
- `KEY_CONTENTS`: Apple Sign In 키 내용 (파이프(|)로 줄바꿈 구분)
- `ANDROID_PACKAGE_IDENTIFIER`: Android 앱의 패키지명

### 선택적 환경 변수
- `REDIRECT_URI`: 커스텀 리다이렉트 URI
- `NODE_ENV`: 환경 설정 (production/development)

## Render 배포 가이드

1. **새로운 Web Service 생성**
   - Render 대시보드에서 "New +" → "Web Service" 선택
   - GitHub 저장소 연결

2. **서비스 설정**
   - **Name**: 원하는 서비스 이름
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free 또는 원하는 플랜

3. **환경 변수 설정**
   - Render 대시보드의 "Environment" 탭에서 위의 환경 변수들을 설정
   - `KEY_CONTENTS`는 Apple Developer에서 다운로드한 .p8 파일 내용을 파이프(|)로 줄바꿈 구분하여 입력

4. **배포**
   - "Create Web Service" 클릭
   - 자동으로 배포가 시작됩니다

## API 엔드포인트

- `GET /`: 헬스체크
- `POST /sign_in_with_apple`: Apple Sign In 처리
- `POST /callbacks/sign_in_with_apple`: Android용 콜백

## 로컬 개발

```bash
npm install
npm run dev
```

서버는 `http://localhost:3000`에서 실행됩니다.