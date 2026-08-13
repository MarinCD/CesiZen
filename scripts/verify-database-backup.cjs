const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const backupDirectory = path.join(process.cwd(), "backups");
const requestedPath = process.argv[2];
const candidates = fs.existsSync(backupDirectory)
  ? fs.readdirSync(backupDirectory).filter((name) => name.endsWith(".json.enc")).sort()
  : [];
const backupPath = requestedPath
  ? path.resolve(requestedPath)
  : candidates.length > 0
    ? path.join(backupDirectory, candidates[candidates.length - 1])
    : null;

if (!backupPath || !fs.existsSync(backupPath)) {
  console.error("Aucune sauvegarde à vérifier. Passez son chemin en argument.");
  process.exit(1);
}

const keyPath = path.join(backupDirectory, ".backup-key");
const encodedKey = process.env.BACKUP_ENCRYPTION_KEY || (fs.existsSync(keyPath) ? fs.readFileSync(keyPath, "utf8").trim() : "");
const key = Buffer.from(encodedKey, "base64");
if (key.length !== 32) {
  console.error("Clé absente ou invalide : configurez BACKUP_ENCRYPTION_KEY ou restaurez backups/.backup-key.");
  process.exit(1);
}

try {
  const envelope = JSON.parse(fs.readFileSync(backupPath, "utf8"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(envelope.iv, "base64"));
  decipher.setAuthTag(Buffer.from(envelope.authTag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, "base64")),
    decipher.final(),
  ]);
  const sha256 = crypto.createHash("sha256").update(plaintext).digest("hex");
  if (sha256 !== envelope.plaintextSha256) throw new Error("empreinte SHA-256 incorrecte");
  const snapshot = JSON.parse(plaintext.toString("utf8"));
  const counts = Object.fromEntries(Object.entries(snapshot.tables).map(([table, rows]) => [table, rows.length]));
  console.log(`Sauvegarde valide : ${backupPath}`);
  console.log(`Créée le : ${snapshot.createdAt}`);
  console.log(`SHA-256 du contenu : ${sha256}`);
  console.log(`Nombre de lignes : ${JSON.stringify(counts)}`);
} catch (error) {
  console.error(`Sauvegarde invalide : ${error.message}`);
  process.exit(1);
}
