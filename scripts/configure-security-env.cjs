/**
 * Génère les secrets manquants du `.env` et remplace ceux qui sont devinables.
 *
 * `NEXTAUTH_SECRET` est traité comme les autres : avec des sessions JWT, une
 * valeur rédigée à la main (nom du projet, "change-me") suffit à forger un
 * jeton administrateur.
 *
 *   node scripts/configure-security-env.cjs            # complète et signale
 *   node scripts/configure-security-env.cjs --rotate   # remplace aussi les valeurs faibles
 */
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const ROTATE = process.argv.includes("--rotate");
const SECRETS = ["NEXTAUTH_SECRET", "AUDIT_HMAC_KEY", "RATE_LIMIT_HMAC_KEY"];

const WEAK_PATTERNS = [
  /change[-_ ]?me/i,
  /cesizen/i,
  /^ci-/i,
  /secret[-_]?key/i,
  /not[-_]used[-_]in[-_]production/i,
  /localhost/i,
  /^(test|demo|dev|password|azerty|qwerty)/i,
];

const isWeak = (value) =>
  !value ||
  value.length < 32 ||
  new Set(value).size < 16 ||
  WEAK_PATTERNS.some((pattern) => pattern.test(value));

const newSecret = () => crypto.randomBytes(48).toString("base64");

const envPath = path.join(process.cwd(), ".env");
const current = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
const lines = current.split(/\r?\n/);

const valueOf = (name) => {
  const line = lines.find((l) => l.match(new RegExp(`^\\s*${name}\\s*=`)));
  if (!line) return null;
  const raw = line.slice(line.indexOf("=") + 1).trim();
  return raw.replace(/^["']|["']$/g, "");
};

const present = new Set(
  lines.map((line) => line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=/)?.[1]).filter(Boolean),
);

const additions = [];
const rotated = [];
const weakLeft = [];

for (const name of SECRETS) {
  if (!present.has(name)) {
    additions.push(`${name}="${newSecret()}"`);
    continue;
  }
  if (!isWeak(valueOf(name))) continue;

  if (ROTATE) {
    const index = lines.findIndex((l) => l.match(new RegExp(`^\\s*${name}\\s*=`)));
    lines[index] = `${name}="${newSecret()}"`;
    rotated.push(name);
  } else {
    weakLeft.push(name);
  }
}

if (!present.has("HDS_COMPLIANT_STORAGE")) {
  additions.push('HDS_COMPLIANT_STORAGE="0"');
}

let content = lines.join("\n");
if (additions.length > 0) {
  const separator = content.length === 0 || content.endsWith("\n") ? "" : "\n";
  const heading = content.length === 0 ? "" : "\n# Durcissement de sécurité\n";
  content = `${content}${separator}${heading}${additions.join("\n")}\n`;
}

if (additions.length > 0 || rotated.length > 0) {
  fs.writeFileSync(envPath, content, { mode: 0o600 });
}
fs.chmodSync(envPath, 0o600);

const report = [];
if (additions.length > 0) {
  report.push(
    `ajoutées : ${additions.map((line) => line.slice(0, line.indexOf("="))).join(", ")}`,
  );
}
if (rotated.length > 0) {
  report.push(`renouvelées : ${rotated.join(", ")} (les sessions en cours sont invalidées)`);
}
console.log(
  report.length > 0
    ? `Variables de sécurité mises à jour sans affichage des valeurs — ${report.join(" ; ")}`
    : "Variables de sécurité déjà présentes ; aucune valeur n'a été modifiée.",
);

if (weakLeft.length > 0) {
  console.error(
    `\n⚠️  Valeurs devinables détectées : ${weakLeft.join(", ")}.\n` +
      `   Relancez avec --rotate, ou remplacez-les par : openssl rand -base64 48`,
  );
  process.exitCode = 1;
}
