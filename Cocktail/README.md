
# 小酌记录 - 鸡尾酒记录应用

一个纯前端的鸡尾酒记录应用，支持使用 Supabase 作为后端存储，或使用本地 localStorage。

## 功能特性

- 📸 上传酒的照片，自动裁剪为正方形
- 📝 记录酒吧名、酒名、基酒、标签、评分、饮用评价
- 🏷️ 添加自定义标签
- ⭐ 5星评分系统
- 📊 数据统计和图表展示
- 🔍 按年和评分筛选
- ✏️ 编辑和删除记录
- 🔐 用户认证和登录（使用 Supabase）
- 💾 本地/云端双重存储支持

## 技术栈

- 原生 HTML/CSS/JavaScript
- Supabase (后端/数据库/认证)
- Canvas 图片处理
- localStorage (回退存储)

## 部署说明

### 1. Supabase 设置

1. 注册并登录 [Supabase](https://supabase.com/)
2. 创建一个新的项目
3. 进入项目的 SQL Editor
4. 运行 `supabase/schema.sql` 文件中的 SQL 脚本
5. 在项目设置中获取以下信息：
   - Project URL
   - anon/public key

### 2. 配置项目

1. 编辑 `supabase/config.js` 文件
2. 填入你的 Supabase 配置：
   ```javascript
   const SUPABASE_CONFIG = {
     url: 'https://your-project-id.supabase.co',
     key: 'your-anon-public-key'
   };
   ```

### 3. 部署到静态网站托管

可以部署到任何静态网站托管平台：
- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- 或本地使用 Live Server 运行

## 数据存储

### 使用 Supabase（推荐）

- 用户注册/登录
- 数据安全存储在云端
- 支持多设备同步
- 行级安全保护用户数据

### 使用本地存储

- 如果未配置 Supabase，应用将自动使用 localStorage
- 数据仅存储在浏览器本地
- 不支持跨设备同步

## 项目结构

```
Cocktail/
├── index.html          # 主页面
├── style.css           # 样式文件
├── script.js           # 业务逻辑
├── README.md           # 本文件
└── supabase/
    ├── config.js       # Supabase 配置
    ├── config.example.js  # 配置示例
    └── schema.sql      # 数据库表结构
```

## 本地开发

1. 克隆或下载项目
2. 配置 Supabase（可选）
3. 使用 Live Server 或任何本地服务器运行

## 功能说明

### 添加记录
- 点击「添加调酒卡牌」按钮
- 填写信息
- 上传照片（可选）
- 选择评分（可选）
- 保存

### 查看记录
- 在主页面查看所有卡片
- 点击卡片查看详情
- 详情页支持编辑和删除

### 筛选
- 按年份筛选
- 按评分筛选

### 统计
- 查看总卡牌数
- 平均评分
- 最常用基酒
- 最常去的酒吧
- 基酒分布饼图

## 许可证

MIT License

