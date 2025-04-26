#!/usr/bin/env ts-node

const [, , hex] = process.argv;

if (!hex) {
  console.error("Usage: hex-decoder <hexstring>");
  process.exit(1);
}

try {
  // Decode hex string to a Buffer, then to UTF-8 string
  const buf = Buffer.from(hex, "hex");
  console.log(buf.toString("utf8"));
} catch (err) {
  console.error("Error: Invalid hex string");
  process.exit(1);
}
