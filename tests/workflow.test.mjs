import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const WORKFLOW_PATH = resolve(".github/workflows/pages.yml");

function jobBlock(workflow, name) {
  const match = new RegExp(`^  ${name}:\\n([\\s\\S]*?)(?=^  [a-z][a-z0-9_-]*:|(?![\\s\\S]))`, "m").exec(workflow);

  assert.ok(match, `the workflow defines the ${name} job`);
  return match[1];
}

function actionStep(job, action) {
  const step = job.split(/^      - /m).slice(1).find((candidate) => candidate.includes(`uses: ${action}`));

  assert.ok(step, `the job uses ${action}`);
  return step;
}

function stepPosition(job, description, matcher) {
  const position = job.split(/^      - /m).slice(1).findIndex(matcher);

  assert.notEqual(position, -1, `the build job includes ${description}`);
  return position;
}

function permissions(source, indentation, description) {
  const lines = source.split("\n");
  const prefix = " ".repeat(indentation);
  const header = lines.findIndex((line) => line === `${prefix}permissions:`);
  const entries = {};

  assert.notEqual(header, -1, `${description} defines permissions`);

  for (const line of lines.slice(header + 1)) {
    if (!line.trim()) continue;

    const leadingSpaces = line.length - line.trimStart().length;
    if (leadingSpaces <= indentation) break;

    assert.equal(leadingSpaces, indentation + 2, `${description} permissions contain no nested entries`);
    const entry = new RegExp(`^${prefix}  ([a-z][a-z-]*): (read|write|none)$`).exec(line);

    assert.ok(entry, `${description} permissions contain only direct read/write/none entries`);
    assert.equal(Object.hasOwn(entries, entry[1]), false, `${description} does not repeat a permission`);
    entries[entry[1]] = entry[2];
  }

  return entries;
}

test("the Pages workflow validates pull requests and deploys the verified site only outside pull requests", async () => {
  assert.equal(existsSync(WORKFLOW_PATH), true, "the Pages workflow exists");

  const workflow = await readFile(WORKFLOW_PATH, "utf8");
  const build = jobBlock(workflow, "build");
  const deploy = jobBlock(workflow, "deploy");

  assert.match(workflow, /^on:\n  pull_request:/m, "pull requests trigger validation");
  assert.match(workflow, /^  push:\n    branches: \[main\]/m, "only main pushes trigger deployment");
  assert.match(workflow, /^  workflow_dispatch:/m, "manual deployments are supported");
  assert.deepEqual(permissions(workflow, 0, "the workflow"), { contents: "read" }, "the workflow defaults to only read-only repository access");
  assert.doesNotMatch(workflow, /^concurrency:/m, "pull-request validation does not share a top-level Pages concurrency group");

  assert.match(build, /uses: actions\/checkout@v6/, "build checks out the site source");
  assert.match(build, /uses: actions\/setup-node@v6\n\s+with:\n\s+node-version: 22\n\s+cache: npm/, "build uses cached Node 22 dependencies");
  assert.deepEqual(permissions(build, 4, "the build job"), { contents: "read", pages: "read" }, "build may only read source and Pages configuration");
  assert.match(build, /run: npm ci/, "build installs the locked dependency set");
  assert.match(build, /run: npm run verify/, "build runs the full verification gate");

  const configure = actionStep(build, "actions/configure-pages@v5");
  const upload = actionStep(build, "actions/upload-pages-artifact@v4");
  const installPosition = stepPosition(build, "npm ci", (step) => step.includes("run: npm ci"));
  const verifyPosition = stepPosition(build, "npm run verify", (step) => step.includes("run: npm run verify"));
  const configurePosition = stepPosition(build, "Pages configuration", (step) => step.includes("uses: actions/configure-pages@v5"));
  const uploadPosition = stepPosition(build, "Pages artifact upload", (step) => step.includes("uses: actions/upload-pages-artifact@v4"));

  assert.ok(installPosition < verifyPosition, "dependency installation precedes verification");
  assert.ok(verifyPosition < configurePosition, "verification succeeds before Pages configuration");
  assert.ok(configurePosition < uploadPosition, "Pages is configured before its artifact is uploaded");
  assert.match(configure, /if: github\.event_name != 'pull_request'/, "Pages configuration is skipped only for pull requests");
  assert.match(upload, /if: github\.event_name != 'pull_request'/, "artifact upload is skipped only for pull requests");
  assert.match(upload, /with:\n\s+path: _site\//, "the generated _site directory is the Pages artifact");

  assert.match(deploy, /needs: build/, "deployment waits for successful verification");
  assert.match(deploy, /if: github\.event_name != 'pull_request'/, "pull requests cannot deploy");
  assert.match(deploy, /concurrency:\n\s+group: pages\n\s+cancel-in-progress: false/, "only non-PR deployments share the stable, non-cancelling Pages group");
  assert.deepEqual(permissions(deploy, 4, "the deploy job"), { pages: "write", "id-token": "write" }, "deployment receives only the required write permissions");
  assert.match(deploy, /environment:\n\s+name: github-pages/, "deployment uses the github-pages environment");
  assert.match(deploy, /uses: actions\/deploy-pages@v4/, "deployment publishes the Pages artifact");
});
