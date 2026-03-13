# 登录与单点登录 (SSO) 设计说明书

## 1. 系统概述

本系统支持两种登录方式：

1. **本地账号登录** - 使用用户名和密码进行身份验证
2. **Azure AD SSO 登录** - 通过 Microsoft Azure Active Directory 实现单点登录

## 2. 技术架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         浏览器客户端                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              LoginClient.tsx (React 组件)               │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │ 本地登录表单 │  │ Azure 按钮  │  │ 注册表单   │     │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │   │
│  └─────────┼────────────────┼────────────────┼────────────┘   │
└────────────┼────────────────┼────────────────┼────────────────┘
             │                │                │
             ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NextAuth.js (身份认证层)                      │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  signIn() 函数                                           │   │
│  │                                                          │   │
│  │  ┌──────────────────────┐  ┌──────────────────────────┐ │   │
│  │  │ Credentials Provider │  │ OAuth Provider           │ │   │
│  │  │ (本地数据库验证)       │  │ (azure-ad)              │ │   │
│  │  └──────────┬───────────┘  └───────────┬──────────────┘ │   │
│  │             │                          │                 │   │
│  │             ▼                          ▼                 │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │            Session / JWT Token 生成                │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       后端服务                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │  PostgreSQL     │  │  Azure AD      │  │  Next.js API │  │
│  │  (用户数据)     │  │  (身份提供商)   │  │  (/api/*)    │  │
│  └─────────────────┘  └─────────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 3. 组件详解

### 3.1 LoginClient.tsx

**文件位置**: `src/app/login/LoginClient.tsx`

#### 主要功能

| 功能 | 说明 |
|------|------|
| 本地账号登录 | 使用 email + password 登录 |
| Azure SSO 登录 | 通过 Azure AD 进行 OAuth 授权 |
| 用户注册 | 创建新的本地账号 |
| 错误处理 | 显示登录/注册错误信息 |

#### Props

```typescript
interface LoginClientProps {
  azureEnabled: boolean;  // 是否启用 Azure SSO
}
```

#### 状态管理

```typescript
const [busy, setBusy] = useState(false);           // 加载状态
const [loginError, setLoginError] = useState(null);     // 登录错误
const [registerError, setRegisterError] = useState(null); // 注册错误
const [registerFieldErrors, setRegisterFieldErrors] = useState({}); // 字段验证错误
```

## 4. 登录流程

### 4.1 本地账号登录流程

```
用户输入邮箱/密码
       │
       ▼
┌──────────────────┐
│  提交表单        │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────┐
│ signIn("credentials", {...}) │
└─────────────┬────────────────┘
              │
              ▼
┌──────────────────────────────┐
│  NextAuth Credentials Provider │
│  - 验证邮箱是否存在           │
│  - 验证密码是否正确           │
└─────────────┬────────────────┘
              │
     ┌────────┴────────┐
     │                 │
     ▼                 ▼
  验证成功          验证失败
     │                 │
     ▼                 │
┌────────────┐   ┌────────────┐
│ 返回 session│   │ 返回 error │
└─────┬──────┘   └────────────┘
      │
      ▼
┌──────────────────┐
│  跳转到 /dashboard │
└──────────────────┘
```

### 4.2 Azure AD SSO 登录流程

```
用户点击 "使用 Azure 账号登录"
       │
       ▼
┌──────────────────────────────┐
│ signIn("azure-ad", {...})    │
└─────────────┬────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│  重定向到 Microsoft 登录页面                 │
│  https://login.microsoftonline.com/...     │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│         用户在 Microsoft 页面输入凭证         │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│  Microsoft 返回 authorization code          │
│  (重定向回应用的 /api/auth/callback/azure-ad)│
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│  NextAuth 用 code 换取 access token          │
│  并获取用户信息 (email, name)                │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│  创建/更新用户 session                       │
│  (如果用户不存在，自动创建)                   │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌──────────────────┐
│  跳转到 /dashboard │
└──────────────────┘
```

## 5. 配置说明

### 5.1 环境变量

需要在 `.env` 文件中配置以下变量：

```bash
# NextAuth 配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Azure AD OAuth 配置
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id
```

### 5.2 NextAuth 配置

参考文件: `src/lib/auth.ts` 或 `src/app/api/auth/[...nextauth]/route.ts`

```typescript
// Azure AD Provider 配置示例
{
  provider: "azure-ad",
  clientId: process.env.AZURE_AD_CLIENT_ID,
  clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
  tenantId: process.env.AZURE_AD_TENANT_ID,
  authorization: {
    params: {
      scope: "openid email profile User.Read",
    },
  },
}
```

## 6. 测试账号

### 6.1 本地测试账号

系统预置了以下测试账号（通过数据库 seed 创建）：

| 账号 | 密码 | 说明 |
|------|------|------|
| admin2@example.com | admin123 | 管理员账号 |

### 6.2 Azure AD 测试

需要配置 Azure AD 应用后，使用 Azure 域下的账号进行测试。

## 7. API 接口

### 7.1 注册接口

**端点**: `POST /api/auth/register`

**请求体**:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应 (成功)**:

```json
{
  "ok": true
}
```

**响应 (失败)**:

```json
{
  "error": "User already exists",
  "details": {
    "issues": [
      {
        "code": "custom",
        "path": ["email"],
        "message": "User already exists"
      }
    ]
  }
}
```

## 8. 错误处理

### 8.1 错误类型

| 错误类型 | 说明 | 处理方式 |
|----------|------|----------|
| Credentials 错误 | 用户名或密码错误 | 显示 "邮箱或密码错误" |
| Azure 错误 | SSO 登录失败 | 显示 Azure 返回的错误信息 |
| Network 错误 | 网络连接问题 | 显示 "请求失败" |
| Validation 错误 | 输入验证失败 | 显示具体字段错误 |

### 8.2 用户友好的错误信息

所有错误信息都通过 i18n 国际化系统处理，确保多语言支持。

## 9. 安全考虑

1. **密码加密**: 使用 bcryptjs 对密码进行哈希存储
2. **JWT Token**: 使用 JWT 进行会话管理
3. **CSRF 保护**: NextAuth 内置 CSRF 保护
4. **Secure Cookie**: 生产环境使用 secure cookie
5. **输入验证**: 使用 Zod 进行服务端输入验证

## 10. 常见问题

### Q1: Azure 登录按钮不显示

**原因**: `azureEnabled` prop 为 `false`

**解决**: 在 `.env` 中正确配置 Azure AD 相关的环境变量

### Q2: 本地登录失败

**原因**: 数据库中不存在该用户或密码错误

**解决**: 确认用户已注册，或使用预置测试账号

### Q3: Azure 登录后无法跳转

**原因**: Azure AD 配置的 redirect URI 不正确

**解决**: 在 Azure AD 应用中正确配置 redirect URI

## 11. 相关文件

| 文件 | 说明 |
|------|------|
| `src/app/login/LoginClient.tsx` | 登录表单组件 |
| `src/app/login/page.tsx` | 登录页面入口 |
| `src/lib/auth.ts` | NextAuth 配置 |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth API 路由 |
| `src/app/api/auth/register/route.ts` | 用户注册 API |

---

# NextAuth.js 深度解析

## 12. NextAuth 核心概念

### 12.1 什么是 NextAuth.js

NextAuth.js 是 Next.js 应用程序的身份认证解决方案，提供了：

- **多Provider支持** - 同时支持多种登录方式（Credentials、OAuth、SAML等）
- **会话管理** - 自动处理用户会话（JWT 或 Database Session）
- **安全保护** - 内置 CSRF 保护、加密签名等
- **无状态架构** - 适合 Serverless 部署

### 12.2 核心文件结构

```
src/
├── lib/
│   └── auth.ts              # NextAuth 配置（核心）
├── app/
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts  # NextAuth API 路由
```

## 13. auth.ts 完整解析

### 13.1 文件位置

`src/lib/auth.ts`

### 13.2 整体结构

```typescript
export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,           // 1. 密钥配置
  session: { strategy: "jwt" },              // 2. 会话策略
  pages: { signIn: "/login" },               // 3. 自定义页面
  providers: [...],                          // 4. 登录提供商
  callbacks: {...},                          // 5. 回调函数
};
```

### 13.3 配置项详解

#### 1. secret - 密钥配置

```typescript
secret: process.env.AUTH_SECRET
```

**作用**: 用于加密 JWT token 和签名 session cookie

**生成方式**: 可以使用以下命令生成:

```bash
openssl rand -base64 32
```

#### 2. session - 会话策略

```typescript
session: { strategy: "jwt" }
```

**可选值**:
| 策略 | 说明 | 适用场景 |
|------|------|----------|
| `jwt` | JWT 无状态会话 | Serverless、无数据库、追求性能 |
| `database` | 数据库会话 | 需要主动失效会话、存储更多会话数据 |

**本项目选择 JWT 的原因**:
- 部署到 Azure App Service
- 无需额外的数据库会话表
- 更好的扩展性

#### 3. pages - 自定义页面

```typescript
pages: { signIn: "/login" }
```

**作用**: 指定登录页面的自定义路径，默认是 `/api/auth/signin`

### 13.4 Providers 配置

NextAuth 支持 100+ 种登录提供商，本项目配置了两种：

#### Credentials Provider (本地账号)

```typescript
CredentialsProvider({
  name: "Credentials",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials) {
    // 1. 验证输入
    const parsed = registerSchema.safeParse(credentials);
    if (!parsed.success) return null;

    // 2. 查询数据库
    const user = await findUserByEmail(parsed.data.email);
    if (!user) return null;

    // 3. 验证密码
    const ok = await compare(parsed.data.password, user.password_hash);
    if (!ok) return null;

    // 4. 返回用户信息
    return { id: user.id, email: user.email, role: user.role };
  },
})
```

**执行流程**:

```
前端调用 signIn("credentials", {email, password})
                    │
                    ▼
        ┌───────────────────────┐
        │ NextAuth 处理         │
        │ - 接收 credentials    │
        │ - 调用 authorize()   │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ authorize() 函数     │
        │ 1. 验证输入格式        │
        │ 2. 查询用户           │
        │ 3. 比较密码           │
        │ 4. 返回用户/ null    │
        └───────────┬───────────┘
                    │
           ┌────────┴────────┐
           │                 │
        返回用户           返回 null
           │                 │
           ▼                 ▼
    生成 JWT Token    返回错误
```

#### Azure AD Provider (OAuth)

```typescript
AzureADProvider({
  clientId: env.azureAdClientId,
  clientSecret: env.azureAdClientSecret,
  tenantId: env.azureAdTenantId,
  authorization: {
    params: { scope: "openid profile email User.Read" },
  },
})
```

**OAuth 权限说明**:

| 权限 | 说明 |
|------|------|
| `openid` | 必须：OIDC 标准 |
| `profile` | 获取用户基本信息（姓名） |
| `email` | 获取用户邮箱 |
| `User.Read` | Microsoft Graph API：读取用户配置 |

**Azure AD 条件注册**:

```typescript
...(env.azureAdClientId && env.azureAdClientSecret && env.azureAdTenantId
  ? [AzureADProvider({...})]
  : [])
```

只有当三个环境变量都配置时才启用 Azure 登录。

### 13.5 Callbacks 回调函数

Callbacks 是 NextAuth 最强大的功能之一，允许在认证流程的各个阶段注入自定义逻辑。

#### 1. signIn - 登录后回调

```typescript
async signIn({ user, account }) {
  // Azure sign-in: auto-provision user on first login only
  if (account?.provider === "azure-ad" && user.email) {
    await ensureAzureUser(user.email);
  }
  return true;
}
```

**触发时机**: 用户成功登录后

**本项目作用**: Azure 用户首次登录时自动在数据库创建用户记录

**ensureAzureUser 函数**:

```typescript
async function ensureAzureUser(email: string): Promise<DbUser> {
  const existing = await findUserByEmail(email);
  if (existing) return existing;  // 用户已存在，直接返回

  // 用户不存在，创建新用户
  const res = await query<DbUser>(
    `insert into users (email, password_hash, provider, role)
     values ($1, null, 'azure', 'user')
     returning id, email, password_hash, provider, role`,
    [email],
  );
  return res.rows[0]!;
}
```

#### 2. jwt - JWT Token 生成/更新回调

```typescript
async jwt({ token, user, account, trigger }) {
  // Credentials 登录：直接从 user 对象获取信息
  if (user) {
    token.userId = user.id;
    token.role = user.role;
  }

  // Azure 登录：从数据库获取用户信息
  // 因为 Azure 登录时 user 对象可能不包含完整的 role 信息
  if (token.email) {
    const dbUser = await findUserByEmail(String(token.email));
    if (dbUser) {
      token.userId = dbUser.id;
      token.role = dbUser.role;
    }
  }

  return token;
}
```

**JWT 生命周期**:

```
┌─────────────────────────────────────────────────────────────┐
│                      JWT Token 生命周期                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  登录请求 ──▶ authorize() 成功 ──▶ jwt() 回调 ──▶ 生成 JWT  │
│                                              │              │
│                                              ▼              │
│                                    ┌──────────────────┐   │
│                                    │ JWT 内容:         │   │
│                                    │ {                 │   │
│                                    │   sub: "userId",  │   │
│                                    │   email: "...",   │   │
│                                    │   role: "admin",  │   │
│                                    │   iat: 1234567890,│   │
│                                    │   exp: 1234571490 │   │
│                                    │ }                 │   │
│                                    └──────────────────┘   │
│                                              │              │
│                                              ▼              │
│                                    ┌──────────────────┐   │
│                                    │ 签名并加密        │   │
│                                    │ 返回给前端        │   │
│                                    └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**token 对象结构**:

| 字段 | 来源 | 说明 |
|------|------|------|
| `sub` | NextAuth 自动 | 用户标识（通常是 email 或 provider ID） |
| `userId` | 自定义 | 数据库用户 ID |
| `role` | 自定义 | 用户角色 |
| `email` | Azure 时 | 用户邮箱 |
| `iat` | NextAuth 自动 | 签发时间 |
| `exp` | NextAuth 自动 | 过期时间 |

#### 3. session - Session 读取回调

```typescript
async session({ session, token }) {
  // 将 JWT 中的用户信息注入到 session
  if (session.user) {
    session.user.id = token.userId;
    session.user.role = token.role;
  }
  return session;
}
```

**session 回调执行时机**:

1. 每次调用 `useSession()` 或 `getServerSession()` 时
2. 客户端水合（hydration）时
3. API 路由中使用 `getServerSession()` 时

**Session 数据流**:

```
┌─────────────────────────────────────────────────────────────┐
│                      Session 数据流                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  浏览器 Cookie (JWT)                                         │
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────────────────────────────┐                   │
│  │ NextAuth API: /api/auth/session     │                   │
│  │ - 验证 JWT 签名                      │                   │
│  │ - 解码 JWT                           │                   │
│  │ - 调用 session() 回调                │                   │
│  └──────────────┬──────────────────────┘                   │
│                 │                                            │
│                 ▼                                            │
│  ┌─────────────────────────────────────┐                   │
│  │ session() 回调执行                   │                   │
│  │ token.userId → session.user.id      │                   │
│  │ token.role  → session.user.role     │                   │
│  └──────────────┬──────────────────────┘                   │
│                 │                                            │
│                 ▼                                            │
│  ┌─────────────────────────────────────┐                   │
│  │ 返回 session 给前端                  │                   │
│  │ { user: { id, email, role } }      │                   │
│  └─────────────────────────────────────┘                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 13.6 TypeScript 类型扩展

NextAuth 使用模块声明扩展来添加自定义类型：

```typescript
// 扩展 User 类型
declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id?: string;
      role?: string;
    };
  }
}

// 扩展 JWT 类型
declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: string;
  }
}
```

**类型扩展的作用**:

```
┌─────────────────────────────────────────────────────────────┐
│                    类型扩展示意图                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  NextAuth 默认类型:                                          │
│  ┌─────────────────────────────────────┐                   │
│  │ User {                               │                   │
│  │   id?: string                        │                   │
│  │   name?: string                      │                   │
│  │   email?: string                     │                   │
│  │   image?: string                     │                   │
│  │ }                                    │                   │
│  └─────────────────────────────────────┘                   │
│                                                              │
│  + 扩展后 (本项目):                                          │
│  ┌─────────────────────────────────────┐                   │
│  │ User {                               │                   │
│  │   id: string      ← 新增             │                   │
│  │   role: UserRole  ← 新增             │                   │
│  │   name?: string                      │                   │
│  │   email?: string                     │                   │
│  │   image?: string                     │                   │
│  │ }                                    │                   │
│  └─────────────────────────────────────┘                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 14. API 路由

### 14.1 文件位置

`src/app/api/auth/[...nextauth]/route.ts`

### 14.2 代码解析

```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

### 14.3 路由端点

NextAuth 自动创建以下端点：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | `/api/auth/signin` | 登录页面 |
| GET/POST | `/api/auth/signout` | 登出 |
| GET | `/api/auth/session` | 获取当前 session |
| GET | `/api/auth/csrf` | 获取 CSRF token |
| GET | `/api/auth/providers` | 获取可用的 providers |

**动态路由 `[...nextauth]` 的作用**:

```
请求 URL                          处理的 handler
─────────────────────────────────────────────────────────
/api/auth/signin         ──▶  NextAuth(signIn)
/api/auth/signout        ───▶  NextAuth(signOut)
/api/auth/session        ───▶  NextAuth(session)
/api/auth/callback/azure-ad → NextAuth(callbackHandler)
/api/auth/providers      ───▶  NextAuth(providers)
```

## 15. 前端集成

### 15.1 客户端 Hook

```typescript
import { useSession, signIn, signOut } from "next-auth/react";

// 获取 session
const { data: session, status } = useSession();

// 登录
signIn("credentials", { email, password });
signIn("azure-ad");

// 登出
signOut();
```

### 15.2 服务端获取 Session

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// 在 Server Component 或 API Route 中
const session = await getServerSession(authOptions);
```

## 16. 数据库用户表结构

### 16.1 users 表

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),      -- 本地登录时存储
  provider VARCHAR(50) NOT NULL,    -- 'local' 或 'azure'
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 16.2 用户类型

```typescript
type UserRole = "admin" | "user" | "viewer";

interface DbUser {
  id: string;
  email: string;
  password_hash: string | null;
  provider: "local" | "azure";
  role: UserRole;
}
```

## 17. 安全最佳实践

### 17.1 本项目采用的安全措施

| 措施 | 实现位置 | 说明 |
|------|----------|------|
| 密码哈希 | `bcryptjs` | 使用 bcrypt 加密存储密码 |
| JWT 签名 | `authOptions.secret` | 使用密钥签名 token |
| HTTPS | 生产环境配置 | 强制 HTTPS |
| CSRF 保护 | NextAuth 内置 | 自动验证 CSRF token |
| 输入验证 | `registerSchema` (Zod) | 验证 email/password 格式 |

### 17.2 密码验证流程

```
用户输入密码: "admin123"
                    │
                    ▼
        ┌───────────────────────┐
        │ bcrypt.hash()          │
        │ cost factor: 10        │
        │ 生成 salt + hash       │
        └───────────┬───────────┘
                    │
                    ▼
        $2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
        ││ │
        ││ └─ hash (59字符)
        │└─── salt (22字符)
        └──── algorithm identifier
                    │
                    ▼
        存储到数据库 password_hash 字段
```

**验证密码时**:

```
输入密码: "admin123"
存储的 hash: $2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
                    │
                    ▼
        ┌───────────────────────┐
        │ bcrypt.compare()      │
        │ 输入 + salt + hash    │
        └───────────┬───────────┘
                    │
           ┌────────┴────────┐
           │                 │
         匹配              不匹配
           │                 │
           ▼                 ▼
       登录成功           登录失败
```

## 18. 调试技巧

### 18.1 开启调试日志

```bash
# 在 .env 中添加
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
DEBUG=nextauth:*
```

### 18.2 常见错误排查

| 错误 | 可能原因 | 解决方案 |
|------|----------|----------|
| `signIn is not defined` | 未导入 `signIn` | 导入: `import { signIn } from "next-auth/react"` |
| `getServerSession returns null` | 未传入 `authOptions` | 确保传入相同的 authOptions |
| `JWT token error` | secret 不匹配 | 确保所有环境的 AUTH_SECRET 一致 |
| `Azure callback failed` | redirect URI 不匹配 | 检查 Azure AD 配置的 redirect URI |

## 19. 扩展阅读

- [NextAuth.js 官方文档](https://next-auth.js.org/)
- [NextAuth.js GitHub](https://github.com/nextauthjs/next-auth)
- [Azure AD Provider 配置](https://next-auth.js.org/providers/azure-ad)
- [bcryptjs 文档](https://github.com/kelektiv/node.bcrypt.js)
