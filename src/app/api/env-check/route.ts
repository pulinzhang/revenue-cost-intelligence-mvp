import { NextResponse } from "next/server";

/**
 * 开发环境下的环境变量检查端点
 * 用于验证 .env.local 文件是否被正确加载
 */
export async function GET() {
  // 只检查关键环境变量是否存在（不显示值，避免泄露敏感信息）
  const envVars = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    AZURE_AD_CLIENT_ID: !!process.env.AZURE_AD_CLIENT_ID,
  };

  return NextResponse.json({
    message: "环境变量检查",
    loaded: envVars,
    note: "值为 true 表示已设置，false 表示未设置",
  });
}
