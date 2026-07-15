import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const dryRun = process.argv.includes("--dry-run");
const allowDirty = dryRun || process.argv.includes("--allow-dirty");

function run(command, options = {}) {
  const { capture = false } = options;

  if (capture) {
    return execSync(command, { encoding: "utf8" }).trim();
  }

  if (dryRun) {
    console.log(`[dry-run] ${command}`);
    return "";
  }

  execSync(command, { stdio: "inherit" });
  return "";
}

function main() {
  const status = run("git status --porcelain", { capture: true });
  if (status && !allowDirty) {
    throw new Error(
      "Working tree is not clean. Please commit or stash changes before release.",
    );
  }
  if (status && allowDirty) {
    console.log("Working tree is not clean. Continue because allow-dirty is enabled.");
  }

  run("git fetch origin main");
  run("git pull --rebase origin main");
  run("pnpm version patch --no-git-tag-version");

  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  const version = packageJson.version;
  if (!version) {
    throw new Error("Missing package version in package.json.");
  }

  run("pnpm build");
  run("git add package.json");
  run(`git commit -m \"chore(release): publish patch v${version}\"`);
  run("git push origin HEAD");

  console.log(`Release complete: v${version}`);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Release failed: ${message}`);
  process.exit(1);
}