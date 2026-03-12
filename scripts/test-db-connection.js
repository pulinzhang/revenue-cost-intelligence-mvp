/**
 * 测试数据库连接
 * 
 * 使用方法：
 * node scripts/test-db-connection.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 读取 .env 文件
const envPath = path.join(__dirname, '..', '.env');
const envLocalPath = path.join(__dirname, '..', '.env.local');

let envContent = '';

// 优先读取 .env.local，如果不存在则读取 .env
if (fs.existsSync(envLocalPath)) {
  envContent = fs.readFileSync(envLocalPath, 'utf-8');
  console.log('📄 读取 .env.local 文件\n');
} else if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf-8');
  console.log('📄 读取 .env 文件\n');
} else {
  console.error('❌ 未找到 .env 或 .env.local 文件');
  process.exit(1);
}

// 提取 DATABASE_URL
const match = envContent.match(/^DATABASE_URL\s*=\s*["']?(.+?)["']?\s*$/m);
if (!match) {
  console.error('❌ 未找到 DATABASE_URL');
  process.exit(1);
}

let databaseUrl = match[1].trim();
databaseUrl = databaseUrl.replace(/^["']|["']$/g, '');

// 将 postgres:// 转换为 postgresql://
if (databaseUrl.startsWith('postgres://')) {
  databaseUrl = databaseUrl.replace('postgres://', 'postgresql://');
}

console.log('🔍 测试数据库连接...\n');

// 显示连接信息（隐藏密码）
const urlObj = new URL(databaseUrl);
const displayUrl = `${urlObj.protocol}//${urlObj.username}:***@${urlObj.hostname}:${urlObj.port}${urlObj.pathname}${urlObj.search}`;
console.log(`🔗 连接地址: ${displayUrl}\n`);

// 创建连接池
const sslMode = (urlObj.searchParams.get('sslmode') || '').toLowerCase();
const shouldUseSsl =
  sslMode === 'require' ||
  sslMode === 'prefer' ||
  sslMode === 'verify-ca' ||
  sslMode === 'verify-full' ||
  urlObj.hostname.endsWith('.supabase.com') ||
  urlObj.hostname.endsWith('.supabase.co');

// IMPORTANT:
// pg / pg-connection-string 会从 URL 的 sslmode 推导 ssl 配置（可能覆盖手动传入的 ssl 选项）。
// 为了让本脚本可控，我们从连接串中移除 sslmode/uselibpqcompat，只通过 `ssl` 选项控制 TLS 行为。
const urlForPg = new URL(databaseUrl);
urlForPg.searchParams.delete('sslmode');
urlForPg.searchParams.delete('uselibpqcompat');
const connectionStringForPg = urlForPg.toString();

const pool = new Pool({
  connectionString: connectionStringForPg,
  // Supabase pooler 常见会触发证书链校验问题；对“连通性测试脚本”而言，禁用校验更实用
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
  max: 1,
  connectionTimeoutMillis: 30_000, // 增加到30秒
  idleTimeoutMillis: 30_000,
  query_timeout: 30_000,
});

async function testConnection() {
  let client;
  try {
    console.log('⏳ 正在连接数据库...');
    
    // 获取客户端
    client = await pool.connect();
    console.log('✅ 数据库连接成功！\n');
    
    // 测试查询
    console.log('📊 测试查询...');
    const result = await client.query('SELECT version(), current_database(), current_user');
    
    console.log('✅ 查询成功！\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 数据库信息：');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`PostgreSQL 版本: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
    console.log(`当前数据库: ${result.rows[0].current_database}`);
    console.log(`当前用户: ${result.rows[0].current_user}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // 检查表是否存在
    console.log('📋 检查数据库表...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('⚠️  数据库中没有表（这是正常的，如果还没有运行 schema.sql）');
      console.log('💡 提示: 运行 sql/schema.sql 来创建表结构\n');
    } else {
      console.log(`✅ 找到 ${tablesResult.rows.length} 个表：`);
      tablesResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.table_name}`);
      });
      console.log('');
    }
    
    console.log('✅ 数据库连接测试完成！程序可以正常连接数据库。\n');
    
  } catch (error) {
    console.error('❌ 数据库连接失败！\n');
    console.error('错误详情：');
    console.error('错误消息:', error.message || '无错误消息');
    console.error('错误代码:', error.code || '无错误代码');
    console.error('错误类型:', error.constructor.name);
    if (error.stack) {
      console.error('\n完整错误堆栈:');
      console.error(error.stack);
    }
    
    if (error.message && error.message.includes('SSL')) {
      console.error('\n💡 提示: 可能是 SSL 配置问题，请检查 DATABASE_URL 是否包含 ?sslmode=require');
    } else if (error.message && error.message.includes('password')) {
      console.error('\n💡 提示: 可能是密码错误，请检查 DATABASE_URL 中的密码');
    } else if (error.message && error.message.includes('timeout')) {
      console.error('\n💡 提示: 连接超时，请检查网络连接和主机地址');
      console.error('   可能的原因:');
      console.error('   1. Supabase 项目可能处于暂停状态');
      console.error('   2. 网络连接问题');
      console.error('   3. 防火墙阻止连接');
      console.error('   4. 主机地址不正确');
    } else {
      console.error('\n💡 提示: 请检查:');
      console.error('   1. Supabase 项目是否处于活动状态');
      console.error('   2. DATABASE_URL 是否正确');
      console.error('   3. 网络连接是否正常');
    }
    
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

testConnection().catch((error) => {
  console.error('❌ 未预期的错误：', error);
  process.exit(1);
});
