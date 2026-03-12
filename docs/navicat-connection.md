# 使用 Navicat 连接 Supabase PostgreSQL

## 从 DATABASE_URL 提取连接信息

你的 `.env` 文件中的 `DATABASE_URL` 格式类似如下（以 Supabase 为例）：

```
postgresql://postgres.<PROJECT_REF>:[YOUR-PASSWORD]@<REGION>.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

> ⚠️ **不要把 `https://<PROJECT_REF>.supabase.co` 当作主机名**
>
> - `https://<PROJECT_REF>.supabase.co` 是 **Supabase API URL**（HTTP）
> - PostgreSQL 连接需要 **数据库主机名**（通常是 `db.<PROJECT_REF>.supabase.co`，或 Dashboard 提供的连接池主机）

### 连接信息解析

从连接字符串中提取以下信息：

- **连接类型**: PostgreSQL
- **主机名/地址**: `<REGION>.pooler.supabase.com`（连接池 Host，Dashboard 会给出）或 `db.<PROJECT_REF>.supabase.co`（直连 DB Host）
- **端口**: 连接池用 `6543`；直连用 `5432`
- **数据库**: `postgres`
- **用户名**: `postgres`
- **密码**: `password` (连接字符串中冒号后的部分)
- **SSL**: 需要启用

## Navicat 配置步骤

### ⚠️ 重要提示：连接超时问题

如果遇到连接超时错误，请：

1. **检查 Supabase 项目是否暂停** - 登录 Dashboard 恢复项目
2. **使用连接池端口 `6543`** 而不是直接连接端口 `5432`（推荐）
3. 查看详细排查指南：`docs/supabase-connection-troubleshooting.md`

### 方式一：使用连接池（推荐，端口 6543）

1. **打开 Navicat**，点击 "连接" → "PostgreSQL"

2. **填写连接信息**：
   - **连接名**: 任意名称（如 "Supabase"）
   - **主机**: 从 `DATABASE_URL` 中提取的主机名（常见为 `<REGION>.pooler.supabase.com`）
   - **端口**: `6543` ⚠️ **使用连接池端口**
   - **初始数据库**: `postgres`
   - **用户名**: `postgres.<PROJECT_REF>`（注意：连接池通常要求这种用户名格式）
   - **密码**: 从 `DATABASE_URL` 中提取的密码

3. **SSL 设置**（重要！）：
   - 切换到 "SSL" 标签页
   - 勾选 "使用 SSL"
   - SSL 模式选择：**"require"**

4. **高级设置**（可选）：
   - 切换到 "高级" 标签页
   - 连接超时：设置为 `30` 秒或更长

5. **测试连接**：
   - 点击 "测试连接" 按钮
   - 如果成功，点击 "确定" 保存

6. **连接数据库**：
   - 双击连接名称即可连接

### 方式二：直接连接（端口 5432）

如果连接池方式不工作，可以尝试直接连接：

1. **打开 Navicat**，点击 "连接" → "PostgreSQL"

2. **填写连接信息**：
   - **连接名**: 任意名称（如 "Supabase Direct"）
   - **主机**: `db.<PROJECT_REF>.supabase.co`（直连 DB Host）
   - **端口**: `5432`
   - **初始数据库**: `postgres`
   - **用户名**: `postgres`
   - **密码**: 从 `DATABASE_URL` 中提取的密码

3. **SSL 设置**（重要！）：
   - 切换到 "SSL" 标签页
   - 勾选 "使用 SSL"
   - SSL 模式选择：**"require"**

4. **测试连接**：
   - 点击 "测试连接" 按钮
   - 如果成功，点击 "确定" 保存

5. **连接数据库**：
   - 双击连接名称即可连接

### 获取连接池连接字符串

在 Supabase Dashboard 中：

1. 进入项目 → **Settings** → **Database**
2. 找到 **Connection string** 部分
3. 选择 **Session mode** 或 **Transaction mode**
4. 复制连接字符串（端口应该是 `6543`）
5. 更新你的 `.env` 文件中的 `DATABASE_URL`

## 快速提取工具

你可以直接查看你的 `.env` 文件中的 `DATABASE_URL` 行。

## 注意事项

- ⚠️ **SSL 必须启用**：Supabase 要求使用 SSL 连接
- 🔒 **密码安全**：确保 `.env` 文件不会被提交到 Git（已在 `.gitignore` 中）
- 📝 **数据库为空**：连接成功后，需要运行 `sql/schema.sql` 来创建表结构
- 🔄 **项目状态**：如果连接超时，检查 Supabase 项目是否处于暂停状态
- 🌐 **连接池推荐**：使用端口 `6543`（连接池）通常比端口 `5432`（直接连接）更稳定

## 连接问题排查

如果遇到连接问题，请查看：

- 📖 **详细排查指南**: `docs/supabase-connection-troubleshooting.md`
- 🔍 **测试连接脚本**: `node scripts/test-db-connection.js`

## 创建数据库表

连接成功后，在 Navicat 中：

1. 打开查询窗口（右键数据库 → "新建查询"）
2. 打开项目中的 `sql/schema.sql` 文件
3. 复制 SQL 内容到查询窗口
4. 执行查询（F5 或点击运行按钮）
