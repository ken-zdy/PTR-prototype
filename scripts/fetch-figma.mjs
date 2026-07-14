// 从 Figma API 拉取指定节点的数据并保存为 figma-node.json
// 用法: node scripts/fetch-figma.mjs
// 需要在 .env 中设置 FIGMA_TOKEN（个人访问令牌）
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// 简单加载 .env（无需额外依赖）
function loadEnv() {
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}

loadEnv();

const TOKEN = process.env.FIGMA_TOKEN;
if (!TOKEN) {
  console.error("❌ 未找到 FIGMA_TOKEN。请在项目根目录的 .env 中设置 FIGMA_TOKEN=你的令牌");
  process.exit(1);
}

// 来自链接: https://www.figma.com/design/GGC9AIbPQZpnUp4Oramj4u/...?node-id=1488-98368
const FILE_KEY = process.env.FIGMA_FILE_KEY || "GGC9AIbPQZpnUp4Oramj4u";
const NODE_ID = (process.env.FIGMA_NODE_ID || "1488-98368").replace("-", ":");

const url = `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(NODE_ID)}`;

console.log(`→ 拉取节点 ${NODE_ID} （文件 ${FILE_KEY}）...`);

const res = await fetch(url, { headers: { "X-Figma-Token": TOKEN } });
if (!res.ok) {
  const body = await res.text();
  console.error(`❌ 请求失败 HTTP ${res.status}: ${body}`);
  process.exit(1);
}

const data = await res.json();
const out = path.join(root, "figma-node.json");
fs.writeFileSync(out, JSON.stringify(data, null, 2));

const node = data.nodes?.[NODE_ID]?.document;
console.log(`✓ 已保存到 figma-node.json`);
if (node) {
  console.log(`  根节点: "${node.name}" (type=${node.type})`);
  const kids = node.children || [];
  console.log(`  子节点数: ${kids.length}`);
  for (const c of kids.slice(0, 40)) {
    console.log(`    - ${c.type}  "${c.name}"`);
  }
} else {
  console.log("  ⚠️ 未在返回中找到该节点，请检查 node-id 是否正确。");
}
