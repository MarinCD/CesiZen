const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const envPath = path.join(process.cwd(), ".env");
const current = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
const present = new Set(
  current
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=/)?.[1])
    .filter(Boolean),
);

const additions = [];
const addSecret = (name) => {
  if (!present.has(name)) {
    additions.push(`${name}="${crypto.randomBytes(48).toString("base64")}"`);
  }
};

addSecret("AUDIT_HMAC_KEY");
addSecret("RATE_LIMIT_HMAC_KEY");
if (!present.has("HDS_COMPLIANT_STORAGE")) {
  additions.push('HDS_COMPLIANT_STORAGE="0"');
}

if (additions.length > 0) {
  const separator = current.length === 0 || current.endsWith("\n") ? "" : "\n";
  const heading = current.length === 0 ? "" : "\n# Durcissement de sécurité\n";
  fs.writeFileSync(envPath, `${current}${separator}${heading}${additions.join("\n")}\n`, {
    mode: 0o600,
  });
}
fs.chmodSync(envPath, 0o600);

console.log(
  additions.length > 0
    ? `Variables de sécurité ajoutées sans affichage des valeurs : ${additions
        .map((line) => line.slice(0, line.indexOf("=")))
        .join(", ")}`
    : "Variables de sécurité déjà présentes ; aucune valeur n'a été modifiée.",
);
