export async function sha256Hex(value, cryptoImpl = globalThis.crypto) {
  if (!cryptoImpl?.subtle) throw Object.assign(new Error("Secure checksum verification is unavailable."), { code: "CRYPTO_UNAVAILABLE" });
  const bytes = value instanceof Uint8Array ? value : new TextEncoder().encode(String(value));
  const digest = await cryptoImpl.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
