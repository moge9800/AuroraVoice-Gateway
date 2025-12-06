AuroraVoice Gateway 是一个部署在 Cloudflare Workers 上的文本转语音（TTS）网关，将后端 TTS 服务封装成简单的 REST API，并附带一个可视化 Web 控制台，方便你快速测试与集成。[web:26][web:31]

> 本项目仅提供网关与前端示例，不内置任何第三方 TTS 上游实现。使用 Edge TTS 或其他云厂商服务时，请自行搭建合规的上游服务，并遵守对应服务条款与版权要求。[web:23][web:24]

---

## 功能特点

- 运行于 Cloudflare Workers，轻量、可全球加速。[web:26]
- 自定义 REST API：
  - `GET /api/health` 健康检查
  - `GET /api/voices` 获取可用语音列表
  - `POST /api/tts/synthesize` 文本合成语音
- 支持 `X-Api-Key` 鉴权（可配置多个密钥）。
- 自带暗色风格 Web 控制台（`web/` 目录），支持：
  - 文本输入
  - 语音选择
  - 语速、语气、音频格式控制
  - 播放历史记录

---

## 项目结构

aurora-voice-gateway/
wrangler.toml # Cloudflare Worker 配置
package.json
tsconfig.json
src/
index.ts # Worker 入口
router.ts # 路由与 API 分发
edgeClient.ts # 调用上游 TTS（需自行替换 URL）
models.ts # 类型定义
config.ts # 配置与 API Key 校验
web/
index.html # Web 控制台页面
app.js # 控制台逻辑
style.css # 控制台样式
README.md

text

---

## 快速开始

### 1. 前置条件

- Node.js 18+
- Cloudflare 账号与 API Token
- 安装 Wrangler CLI：

npm install -g wrangler

text

Cloudflare 官方推荐使用 Wrangler 管理和部署 Workers。[web:26][web:33]

### 2. 克隆与安装依赖

git clone https://github.com/<your-name>/aurora-voice-gateway.git
cd aurora-voice-gateway
npm install

text

### 3. 配置 `wrangler.toml`

在项目根目录编辑 `wrangler.toml`：

name = "aurora-voice-gateway"
main = "src/index.ts"
compatibility_date = "2024-12-31"
workers_dev = true

[vars]

多个 key 用逗号分隔；不设置则关闭 API Key 限制
ALLOWED_API_KEYS = "demo-key-1,demo-key-2"

TTS 默认参数示例（可按需调整）
EDGE_REGION = "southeastasia"
EDGE_VOICE_DEFAULT = "zh-CN-XiaoxiaoNeural"

[observability]
enabled = true

text

- 未设置 `ALLOWED_API_KEYS` 时，会关闭 API Key 校验。
- `EDGE_REGION`、`EDGE_VOICE_DEFAULT` 供上游 TTS 使用，可根据实际场景调整。

### 4. 配置 TTS 上游服务

在 `src/edgeClient.ts` 中存在一个占位上游地址：

const upstreamUrl = "https://your-edge-tts-upstream.example.com/synthesize";

text

你需要：

- 自行实现一个合规的 TTS 上游服务（例如使用官方 SDK/公开接口部署一个 HTTP 端点）。[web:23][web:24]
- 或将该 URL 替换为你实际可用的 TTS HTTP 接口。

上游服务预期行为示例：

- 接收 `Content-Type: application/ssml+xml` 的 POST 请求，Body 为 SSML。
- 响应 200 时返回音频二进制数据（`audio/mpeg` / `audio/wav` 等）。
- 非 2xx 时返回错误文本。

请务必遵守所使用服务的条款与版权，不抓取、绕过或滥用任何未授权接口。

---

## 本地开发与测试

### 1. 启动本地开发 Worker

npm run dev

text

Wrangler 会启动本地开发服务，一般为 `http://127.0.0.1:8787`。[web:26]

### 2. 基础接口测试

#### 健康检查

curl http://127.0.0.1:8787/api/health

text

示例响应：

{
"status": "ok",
"time": "2025-01-01T00:00:00.000Z"
}

text

#### 获取语音列表

curl http://127.0.0.1:8787/api/voices

text

示例响应（简化）：

{
"voices": [
{
"id": "zh-CN-XiaoxiaoNeural",
"name": "Mandarin Female Narrator",
"language": "zh-CN",
"gender": "female",
"tags": ["narration", "default"]
}
]
}

text

#### 合成语音

如果你配置了 API Key，需要在请求头添加 `X-Api-Key`。示例：

curl -X POST http://127.0.0.1:8787/api/tts/synthesize
-H "Content-Type: application/json"
-H "X-Api-Key: demo-key-1"
-d '{
"text": "你好，这里是 AuroraVoice 网关测试。",
"voice_id": "zh-CN-XiaoxiaoNeural",
"speed": 1.0,
"tone": "neutral",
"audio_format": "mp3"
}' --output out.mp3

text

如果未配置 `ALLOWED_API_KEYS`，可以省略 `X-Api-Key` 请求头。

---

## 正式部署到 Cloudflare

npm run deploy

text

部署完成后，你会看到 Worker 访问地址，例如：

https://aurora-voice-gateway.<your-account>.workers.dev

text

你也可以在 Cloudflare 控制台为该 Worker 绑定自定义域名。[web:31]

---

## Web 控制台使用说明

`web/` 目录包含一个简单的前端控制台，用于测试网关：

1. 将 `web` 目录部署到任意静态托管服务（如 Cloudflare Pages）。[web:31]
2. 打开浏览器访问站点。
3. 在“Worker 地址”中填入你的 Worker URL，例如：
   - `https://aurora-voice-gateway.<your-account>.workers.dev`
4. 如启用了 API Key，在“API Key”输入框填入对应值。
5. 输入文本、选择语音和参数，点击“开始合成”，即可在右侧播放器中试听结果。

---

## API 参考

### 1. `GET /api/health`

- 描述：健康检查。
- 返回：

{
"status": "ok",
"time": "2025-01-01T00:00:00.000Z"
}

text

### 2. `GET /api/voices`

- 描述：获取预设的语音信息列表。
- 返回字段：
  - `id`: 语音 ID（传给上游 TTS 的 voice 名称）
  - `name`: 语音描述
  - `language`: 语言代码（如 `zh-CN`）
  - `gender`: `"male" | "female" | "unknown"`
  - `tags`: 自定义标签数组

### 3. `POST /api/tts/synthesize`

- 请求头：
  - `Content-Type: application/json`
  - 可选：`X-Api-Key: <your-key>`（若设置了 `ALLOWED_API_KEYS`）
- 请求体参数：

| 字段          | 类型     | 必填 | 说明                          |
|---------------|----------|------|-------------------------------|
| `text`        | string   | 是   | 要朗读的文本                  |
| `voice_id`    | string   | 否   | 语音 ID，默认为默认语音      |
| `speed`       | number   | 否   | 语速，范围约 -1.0 ~ 2.0      |
| `tone`        | string   | 否   | `"neutral" \| "warm" \| "news"` |
| `audio_format`| string   | 否   | `"mp3" \| "ogg" \| "wav"`     |

- 响应：
  - 成功：`200`，返回音频数据流，`Content-Type` 为 `audio/mpeg` / `audio/ogg` / `audio/wav`。
  - 失败：返回 JSON 错误体，例如：

{
"code": "UPSTREAM_ERROR",
"message": "Edge TTS upstream error: 500"
}

text

---

## 安全与版权提示

- 本项目本身不含任何第三方 TTS 上游实现，只是一个通用网关骨架和前端示例。
- 使用 Edge TTS、Azure、Google Cloud、阿里云等 TTS 服务时，请：
  - 仔细阅读并遵守各自的服务条款与隐私政策。[web:23][web:24]
  - 不抓取或绕过未授权接口。
  - 不用于侵犯版权或违反当地法律的用途。
- 仓库代码可以自由自用和二次开发，但你有责任确保实际接入的上游服务是授权、合规的。

---

## 许可

本项目代码可用于学习、个人项目和二次开发。分发时请保留本说明中对第三方服务条款、版权和合法合规使用的提醒。
