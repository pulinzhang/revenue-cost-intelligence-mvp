# Supabase 连接问题排查指南

## 常见问题：连接超时

如果你遇到连接超时错误（Connection timed out），请按照以下步骤排查：

## 1. 检查 Supabase 项目状态

### 问题：项目可能处于暂停状态

Supabase 免费计划的项目在闲置一段时间后会自动暂停。你需要：

1. **登录 Supabase Dashboard**
   - 访问 https://app.supabase.com
   - 登录你的账户

2. **检查项目状态**
   - 在项目列表中查看项目状态
   - 如果项目显示为 "Paused"（暂停），点击 "Restore"（恢复）
   - 等待几分钟让项目完全启动

3. **验证项目是否在线**
   - 项目恢复后，状态应该显示为 "Active"
   - 等待 2-3 分钟确保数据库服务完全启动

## 2. 使用正确的连接方式

Supabase 提供两种连接方式：

### 方式 A：直接连接（Direct Connection）
- **主机**: 通常是 `db.<PROJECT_REF>.supabase.co`
- **端口**: `5432`
- **用途**: 适用于迁移（migrations）、管理任务等需要直连数据库的场景
- **注意**: 直连不是连接池；不要把 pooler host 搭配 `5432`

### 方式 B：连接池（Connection Pooler）⭐ 推荐
- **主机**: 通常类似 `<REGION>.pooler.supabase.com`（Dashboard 会给出完整连接串）
- **端口**: `6543`（Session/Transaction mode 都是 6543）
- **用途**: 适用于应用程序、以及大多数数据库管理工具（例如 Navicat）
- **优势**: 更好的连接管理和稳定性

## 3. 获取正确的连接字符串

### 在 Supabase Dashboard 中：

1. 进入你的项目
2. 点击左侧菜单 **Settings** → **Database**
3. 滚动到 **Connection string** 部分
4. 选择连接模式：
   - **URI** - 完整连接字符串
   - **Session mode** - 使用连接池（推荐）
   - **Transaction mode** - 事务模式连接池

### 连接字符串格式：

**直接连接（Direct DB，端口 5432）：**
```
postgresql://postgres:[YOUR-PASSWORD]@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require
```

**连接池（Pooler，端口 6543）- Session mode：**
```
postgresql://postgres.<PROJECT_REF>:[YOUR-PASSWORD]@<REGION>.pooler.supabase.com:6543/postgres?sslmode=require
```

**连接池（Pooler，端口 6543）- Transaction mode：**
```
postgresql://postgres.<PROJECT_REF>:[YOUR-PASSWORD]@<REGION>.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

## 4. Navicat 配置步骤（使用连接池）

### 推荐配置（使用连接池端口 6543）：

1. **打开 Navicat**，点击 "连接" → "PostgreSQL"

2. **填写连接信息**：
   - **连接名**: Supabase (Pooler)
   - **主机**: `<REGION>.pooler.supabase.com`（从 Supabase Dashboard 复制）
   - **端口**: `6543` ⚠️ **重要：使用连接池端口**
   - **初始数据库**: `postgres`
   - **用户名**: `postgres`
   - **密码**: 从 Supabase Dashboard 获取

3. **SSL 设置**（必须）：
   - 切换到 "SSL" 标签页
   - 勾选 "使用 SSL"
   - SSL 模式选择：**"require"**

4. **高级设置**（可选）：
   - 切换到 "高级" 标签页
   - 连接超时：设置为 `30` 秒或更长

5. **测试连接**：
   - 点击 "测试连接" 按钮
   - 如果成功，点击 "确定" 保存

## 5. 检查防火墙和网络

### Windows 防火墙：
- 确保 Navicat 或 PostgreSQL 客户端没有被防火墙阻止
- 检查 Windows Defender 防火墙设置

### 网络连接：
- 尝试 ping 主机名：`ping [PROJECT-REF].supabase.co`
- 检查是否能解析域名到正确的 IP 地址

### 代理设置：
- 如果你在公司网络或使用代理，可能需要配置代理设置
- 在 Navicat 的高级设置中配置代理

## 6. 验证连接信息

### 从 Supabase Dashboard 获取最新信息：

1. **Settings** → **Database** → **Connection string**
2. **复制完整的连接字符串**
3. **更新你的 `.env` 文件**

### 解析连接字符串：

连接字符串格式：
```
postgresql://[用户名]:[密码]@[主机]:[端口]/[数据库]?[参数]
```

示例：
```
postgresql://postgres:your_password@abc123.supabase.co:6543/postgres?sslmode=require
```

解析结果：
- 用户名: `postgres`
- 密码: `your_password`
- 主机: `db.<PROJECT_REF>.supabase.co`（或 Dashboard 的连接池 Host）
- 端口: `6543`
- 数据库: `postgres`
- SSL: `require`

## 7. 常见错误和解决方案

### 错误 1: Connection timed out (0x0000274C/10060)
**原因**: 
- 项目处于暂停状态
- 使用了错误的端口（应该使用 6543 而不是 5432）
- 网络连接问题

**解决方案**:
1. 检查并恢复 Supabase 项目
2. 使用连接池端口 `6543`
3. 检查网络连接

### 错误 2: SSL connection required
**原因**: 未启用 SSL

**解决方案**:
- 在 Navicat 中启用 SSL，模式选择 "require"

### 错误 3: password authentication failed
**原因**: 密码错误

**解决方案**:
- 从 Supabase Dashboard 重新获取密码
- 确保密码中没有特殊字符编码问题

## 8. 测试连接脚本

运行项目中的测试脚本：
```bash
node scripts/test-db-connection.js
```

这个脚本会：
- 显示连接信息（隐藏密码）
- 测试数据库连接
- 显示详细的错误信息

## 9. 联系 Supabase 支持

如果以上方法都无法解决问题：

1. 检查 Supabase Status Page: `https://status.supabase.com`
2. 查看 Supabase 文档: `https://supabase.com/docs`
3. 在 Supabase Discord 社区寻求帮助
4. 提交 Supabase 支持工单

## 总结

**最可能的原因和解决方案**：

1. ✅ **项目暂停** → 在 Dashboard 中恢复项目
2. ✅ **使用错误端口** → 使用连接池端口 `6543` 而不是 `5432`
3. ✅ **SSL 未启用** → 在 Navicat 中启用 SSL
4. ✅ **连接字符串过期** → 从 Dashboard 重新获取最新连接字符串

**推荐配置**：
- 使用连接池端口 `6543`
- 启用 SSL（require 模式）
- 从 Supabase Dashboard 获取最新的连接字符串
