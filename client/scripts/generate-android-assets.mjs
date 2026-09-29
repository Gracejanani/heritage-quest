import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const clientDirectory = path.resolve(scriptDirectory, "..");
const logoPath = path.join(
  clientDirectory,
  "public",
  "heritage-quest-logo.svg",
);
const assetsDirectory = path.join(clientDirectory, "assets");

await mkdir(assetsDirectory, { recursive: true });

await sharp(logoPath)
  .resize(1024, 1024)
  .png()
  .toFile(path.join(assetsDirectory, "icon-only.png"));

const splashLogo = await sharp(logoPath).resize(900, 900).png().toBuffer();

await sharp({
  create: {
    width: 2732,
    height: 2732,
    channels: 4,
    background: "#FFF8EA",
  },
})
  .composite([{ input: splashLogo, gravity: "centre" }])
  .png()
  .toFile(path.join(assetsDirectory, "splash.png"));

console.log("Generated Heritage Quest Android icon and splash sources.");
