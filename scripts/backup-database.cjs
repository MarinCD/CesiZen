const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  for (const sourceLine of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = sourceLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const name = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(name in process.env)) process.env[name] = value;
  }
}

loadLocalEnv();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({ log: ["error"] });

const APPLICATION_TABLES = [
  "utilisateur",
  "information",
  "questionnaire",
  "diagnostic",
  "question",
  "reponse",
  "resultat_diagnostic",
  "audit_log",
  "tracker_emotion",
  "rate_limit_attempt",
  "_prisma_migrations",
];

const serialize = (value) =>
  JSON.stringify(value, (_key, item) => {
    if (typeof item === "bigint") return { $type: "bigint", value: item.toString() };
    if (Buffer.isBuffer(item)) return { $type: "buffer", value: item.toString("base64") };
    return item;
  });

function getOrCreateKey(backupDirectory) {
  const configured = process.env.BACKUP_ENCRYPTION_KEY;
  if (configured) {
    const decoded = Buffer.from(configured, "base64");
    if (decoded.length !== 32) throw new Error("BACKUP_ENCRYPTION_KEY doit contenir exactement 32 octets encodés en base64.");
    return { key: decoded, source: "BACKUP_ENCRYPTION_KEY" };
  }

  const keyPath = path.join(backupDirectory, ".backup-key");
  if (!fs.existsSync(keyPath)) {
    fs.writeFileSync(keyPath, crypto.randomBytes(32).toString("base64"), { mode: 0o600 });
  }
  fs.chmodSync(keyPath, 0o600);
  const key = Buffer.from(fs.readFileSync(keyPath, "utf8").trim(), "base64");
  if (key.length !== 32) throw new Error(`Clé de sauvegarde invalide : ${keyPath}`);
  return { key, source: keyPath };
}

async function main() {
  const backupDirectory = path.join(process.cwd(), "backups");
  fs.mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });
  fs.chmodSync(backupDirectory, 0o700);

  const tableRows = await prisma.$queryRawUnsafe("SHOW TABLES");
  const existingTables = new Set(tableRows.map((row) => String(Object.values(row)[0])));
  const tables = {};
  for (const table of APPLICATION_TABLES) {
    if (existingTables.has(table)) {
      tables[table] = await prisma.$queryRawUnsafe(`SELECT * FROM \`${table}\``);
    }
  }

  const snapshot = {
    format: "cesizen-database-backup-v1",
    createdAt: new Date().toISOString(),
    database: new URL(process.env.DATABASE_URL).pathname.replace(/^\//, ""),
    tables,
  };
  const plaintext = Buffer.from(serialize(snapshot));
  const plaintextSha256 = crypto.createHash("sha256").update(plaintext).digest("hex");
  const { key, source } = getOrCreateKey(backupDirectory);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const envelope = {
    format: "cesizen-encrypted-backup-v1",
    algorithm: "aes-256-gcm",
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    plaintextSha256,
    ciphertext: ciphertext.toString("base64"),
  };

  const stamp = snapshot.createdAt.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const backupPath = path.join(backupDirectory, `cesizen-pre-migration-${stamp}.json.enc`);
  fs.writeFileSync(backupPath, JSON.stringify(envelope), { mode: 0o600 });
  fs.chmodSync(backupPath, 0o600);

  // Vérification immédiate : authentification GCM, empreinte et JSON relisible.
  const stored = JSON.parse(fs.readFileSync(backupPath, "utf8"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(stored.iv, "base64"));
  decipher.setAuthTag(Buffer.from(stored.authTag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(stored.ciphertext, "base64")),
    decipher.final(),
  ]);
  const actualSha256 = crypto.createHash("sha256").update(decrypted).digest("hex");
  if (actualSha256 !== stored.plaintextSha256) throw new Error("L'empreinte de la sauvegarde ne correspond pas.");
  JSON.parse(decrypted.toString("utf8"));

  const counts = Object.fromEntries(Object.entries(tables).map(([table, rows]) => [table, rows.length]));
  console.log(`Sauvegarde chiffrée et vérifiée : ${backupPath}`);
  console.log(`Clé utilisée : ${source} (valeur non affichée)`);
  console.log(`SHA-256 du contenu : ${actualSha256}`);
  console.log(`Nombre de lignes : ${JSON.stringify(counts)}`);
}

main()
  .catch((error) => {
    console.error(`Échec de la sauvegarde : ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
