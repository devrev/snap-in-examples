import { Manifest } from "@devrev-internal/snap-in-manifest";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import manifest from "../manifest.config";

const out = process.env.MANIFEST_OUTPUT ?? resolve(process.cwd(), "..", "manifest.yaml");
writeFileSync(out, Manifest.toYaml(manifest), "utf8");
console.log(`Wrote ${out}`);
