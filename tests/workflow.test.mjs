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

test("the Pages workflow validates pull requests and deploys the verified site only outside pull requests", async () => {
  assert.equal(existsSync(WORKFLOW_PATH), true, "the Pages workflow exists");

  const workflow = await readFile(WORKFLOW_PATH, "utf8");
  const build = jobBlock(workflow, "build");
  const deploy = jobBlock(workflow, "deploy");

  assert.match(workflow, /^on:\n  pull_request:/m, "pull requests trigger validation");
  assert.match(workflow, /^  push:\n    branches: \[main\]/m, "only main pushes trigger deployment");
  assert.match(workflow, /^  workflow_dispatch:/m, "manual deployments are supported");
  assert.match(workflow, /^permissions:\n  contents: read$/m, "the workflow defaults to read-only repository access");
  assert.match(workflow, /^concurrency:\n  group: pages\n  cancel-in-progress: false$/m, "Pages deployments use a stable, non-cancelling concurrency group");

  assert.match(build, /uses: actions\/checkout@v6/, "build checks out the site source");
  assert.match(build, /uses: actions\/setup-node@v6\n\s+with:\n\s+node-version: 22\n\s+cache: npm/, "build uses cached Node 22 dependencies");
  assert.match(build, /permissions:\n\s+contents: read\n\s+pages: read/, "build may read Pages configuration without deployment authority");
  assert.match(build, /run: npm ci/, "build installs the locked dependency set");
  assert.match(build, /run: npm run verify/, "build runs the full verification gate");

  const configure = actionStep(build, "actions/configure-pages@v5");
  const upload = actionStep(build, "actions/upload-pages-artifact@v4");

  assert.match(configure, /if: github\.event_name != 'pull_request'/, "Pages configuration is skipped only for pull requests");
  assert.match(upload, /if: github\.event_name != 'pull_request'/, "artifact upload is skipped only for pull requests");
  assert.match(upload, /with:\n\s+path: _site\//, "the generated _site directory is the Pages artifact");

  assert.match(deploy, /needs: build/, "deployment waits for successful verification");
  assert.match(deploy, /if: github\.event_name != 'pull_request'/, "pull requests cannot deploy");
  assert.match(deploy, /permissions:\n\s+pages: write\n\s+id-token: write/, "deployment receives only the required write permissions");
  assert.match(deploy, /environment:\n\s+name: github-pages/, "deployment uses the github-pages environment");
  assert.match(deploy, /uses: actions\/deploy-pages@v4/, "deployment publishes the Pages artifact");
});
