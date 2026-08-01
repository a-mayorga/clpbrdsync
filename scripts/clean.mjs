import { rm } from "node:fs/promises";
import { resolve } from "node:path";

const rootDirectories = [".turbo", "node_modules"];

for (const directory of rootDirectories) {
  const absolutePath = resolve(process.cwd(), directory);

  await rm(absolutePath, {
    recursive: true,
    force: true,
  });

  console.log(`Removed ${absolutePath}`);
}
