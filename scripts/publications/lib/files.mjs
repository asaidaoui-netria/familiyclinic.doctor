import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { rename, rm, writeFile } from "node:fs/promises";

export async function sha256File(filePath) {
  const hash = createHash("sha256");
  const stream = createReadStream(filePath);

  for await (const chunk of stream) {
    hash.update(chunk);
  }

  return hash.digest("hex");
}

export async function writeJsonAtomic(filePath, value) {
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;

  try {
    const serialized = `${JSON.stringify(value, null, 2)}\n`;
    await writeFile(temporaryPath, serialized, { flag: "wx" });
    await rename(temporaryPath, filePath);
  } catch (error) {
    await rm(temporaryPath, { force: true });
    throw error;
  }
}
