# Email Backup Tool

이메일 전송을 위한 Node.js 스크립트입니다. 지정한 SMTP 서버를 통해 이메일을 전송합니다.

## 📋 요구사항

- Node.js 14.0.0 이상
- npm 6.0.0 이상
- SMTP 서버 접속 정보

## 🚀 설치 방법

1. 저장소를 클론합니다:

   ```bash
   git clone https://github.com/yourusername/mail-backup.git
   cd mail-backup
   ```

2. 의존성을 설치합니다:

   ```bash
   npm install
   ```

3. `.env` 파일을 생성하고 환경 변수를 설정합니다:
   ```bash
   cp .env.example .env
   ```
   `.env` 파일에 SMTP 서버 정보를 입력하세요.

## ⚙️ 환경 변수

`.env` 파일에 다음 변수들을 설정해야 합니다:

```
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password
FROM_NAME=Your Name
FROM_EMAIL=your-email@example.com
TO_EMAIL=recipient@example.com
EMAIL_SUBJECT="Mail title"
```

## 🏃 사용 방법

```bash
node send-email.js
```

## 📁 프로젝트 구조

```
.
├── .env.example         # 환경 변수 예시 파일
├── .gitignore          # Git 무시 파일
├── README.md           # 이 파일
├── package.json        # 프로젝트 의존성 및 스크립트
├── send-email.js       # 메인 스크립트
└── templates/          # 이메일 템플릿 디렉토리
```

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.
