/**
 * @file send-email.js
 * @description 이메일 발송 유틸리티. SMTP를 통해 이메일을 전송합니다.
 * @version 1.0.0
 * @license MIT
 */

import "dotenv/config";
import nodemailer from "nodemailer";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 로그 레벨 (debug, info, warn, error)
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

/**
 * 로그 레벨에 따른 로그 출력
 * @param {string} level - 로그 레벨 (debug, info, warn, error)
 * @param {string} message - 로그 메시지
 * @param {*} [data] - 추가 데이터 (선택사항)
 */
function log(level, message, data) {
  const levels = { debug: 0, info: 1, warn: 2, error: 3 };
  const currentLevel = levels[LOG_LEVEL] || 1;
  const messageLevel = levels[level] || 1;

  if (messageLevel >= currentLevel) {
    const timestamp = new Date().toISOString();
    const logData = data ? `\n${JSON.stringify(data, null, 2)}` : "";
    console[level](
      `[${timestamp}] [${level.toUpperCase()}] ${message}${logData}`
    );
  }
}

/**
 * 환경 변수 검증
 * @throws {Error} 필수 환경 변수가 누락된 경우
 */
function validateEnvironment() {
  const requiredEnvVars = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_SECURE",
    "SMTP_USER",
    "SMTP_PASS",
    "FROM_NAME",
    "FROM_EMAIL",
    "TO_EMAIL",
    "EMAIL_SUBJECT",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    const errorMessage = `필수 환경 변수가 설정되지 않았습니다: ${missingVars.join(
      ", "
    )}`;
    log("error", errorMessage);
    throw new Error(errorMessage);
  }

  // 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(process.env.FROM_EMAIL)) {
    const errorMessage = `유효하지 않은 발신자 이메일 형식입니다: ${process.env.FROM_EMAIL}`;
    log("error", errorMessage);
    throw new Error(errorMessage);
  }

  // 포트 번호 검증
  const port = parseInt(process.env.SMTP_PORT, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    const errorMessage = `유효하지 않은 포트 번호입니다: ${process.env.SMTP_PORT}`;
    log("error", errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * 이메일 템플릿 로드
 * @returns {Promise<string>} 렌더링된 HTML 문자열
 */
async function loadTemplate() {
  const templatePath = join(__dirname, "templates", "email-template.html"); // 템플릿 파일 경로

  try {
    return await readFile(templatePath, "utf-8");
  } catch (error) {
    log("error", "이메일 템플릿을 로드하는 중 오류가 발생했습니다", {
      error: error.message,
      path: templatePath,
    });
    throw new Error(`템플릿 파일을 로드할 수 없습니다: ${error.message}`);
  }
}

/**
 * 이메일 발송
 * @param {Object} options - 이메일 발송 옵션
 * @param {string} options.to - 수신자 이메일 주소
 * @param {string} options.subject - 이메일 제목
 * @returns {Promise<Object>} 발송 결과
 */
async function sendEmail({ to, subject }) {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
    FROM_NAME,
    FROM_EMAIL,
  } = process.env;

  try {
    // SMTP 전송기 생성
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT, 10),
      secure: SMTP_SECURE === "true",
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      // 연결 타임아웃 설정 (10초)
      connectionTimeout: 10000,
      // 명시적 TLS 사용
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === "production",
      },
    });

    // SMTP 연결 테스트
    try {
      await transporter.verify();
      log("debug", "SMTP 서버에 성공적으로 연결되었습니다.");
    } catch (error) {
      log("error", "SMTP 서버 연결에 실패했습니다", error);
      throw new Error(`SMTP 연결 실패: ${error.message}`);
    }

    // HTML 템플릿 로드
    const html = await loadTemplate();

    // 이메일 발송
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      // 발송자와 수신자 이메일을 헤더에 추가하여 스푸핑 방지
      headers: {
        "X-Sender": FROM_EMAIL,
        "X-Receiver": to,
        "X-Auto-Response-Suppress": "OOF, AutoReply",
      },
    });

    log("info", "이메일이 성공적으로 전송되었습니다", {
      messageId: info.messageId,
      to,
      subject,
      envelope: info.envelope,
    });

    // 개발 환경에서만 미리보기 URL 표시
    if (process.env.NODE_ENV !== "production") {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        log("debug", "이메일 미리보기 URL", { previewUrl });
      }
    }

    return info;
  } catch (error) {
    log("error", "이메일 전송 중 오류가 발생했습니다", {
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
    throw error;
  }
}

/**
 * 메인 함수
 */
async function main() {
  try {
    log("info", "이메일 발송을 시작합니다");

    // 환경 변수 검증
    validateEnvironment();

    // 이메일 발송
    await sendEmail({
      to: process.env.TO_EMAIL,
      subject: process.env.EMAIL_SUBJECT,
    });

    log("info", "이메일 발송이 완료되었습니다");
    process.exit(0);
  } catch (error) {
    log("error", "프로그램 실행 중 오류가 발생했습니다", {
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
    process.exit(1);
  }
}

// 메인 함수 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(() => process.exit(1));
}

export { sendEmail, loadTemplate, validateEnvironment };
