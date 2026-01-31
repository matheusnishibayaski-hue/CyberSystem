const fs = require("fs");
const path = require("path");

const inputPath = process.argv[2] || "semgrep-result.json";
const resolvedPath = path.resolve(inputPath);

function readJsonWithEncoding(filePath) {
  const buffer = fs.readFileSync(filePath);

  // Detect BOM for UTF-16LE or UTF-8
  const isUtf16Le =
    buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe;
  const isUtf8Bom =
    buffer.length >= 3 &&
    buffer[0] === 0xef &&
    buffer[1] === 0xbb &&
    buffer[2] === 0xbf;

  let text;
  if (isUtf16Le) {
    text = buffer.toString("utf16le");
  } else if (isUtf8Bom) {
    text = buffer.toString("utf8").replace(/^\uFEFF/, "");
  } else {
    text = buffer.toString("utf8");
  }

  return JSON.parse(text);
}

let data;
try {
  data = readJsonWithEncoding(resolvedPath);
} catch (err) {
  console.error(`[ERRO] Nao foi possivel ler ${resolvedPath}`);
  console.error(err && err.message ? err.message : err);
  process.exit(1);
}

const results = Array.isArray(data.results) ? data.results : [];

if (results.length > 0) {
  console.log("⚠️ Vulnerabilidades encontradas:");
  results.forEach((r) => {
    const checkId = r.check_id || "unknown";
    const message = (r.extra && r.extra.message) || "";
    console.log(`- ${checkId}: ${message}`);
  });
} else {
  console.log("✅ Nenhuma vulnerabilidade encontrada.");
}
