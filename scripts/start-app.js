const { spawn, spawnSync } = require("node:child_process");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const backendDir = path.join(rootDir, "backend");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const npmCli = process.env.npm_execpath;

function runNpm(args, cwd) {
  if (npmCli) {
    run(process.execPath, [npmCli, ...args], cwd);
  } else {
    run(npm, args, cwd, { shell: process.platform === "win32" });
  }
}

function startNpm(args, cwd) {
  if (npmCli) {
    return spawn(process.execPath, [npmCli, ...args], {
      cwd,
      stdio: "inherit",
      shell: false
    });
  }
  return spawn(npm, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32"
  });
}

function run(command, args, cwd, options = {}) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32" && command === npm,
    ...options
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited with code ${result.status}`);
  }
}

function waitForDatabase() {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    const result = spawnSync(
      "docker",
      ["compose", "exec", "-T", "postgres", "pg_isready", "-U", "hifpb", "-d", "hifpb_monteiro"],
      { cwd: rootDir, stdio: "ignore", shell: false }
    );
    if (result.status === 0) {
      return;
    }
    console.log(`Waiting for PostgreSQL (${attempt}/30)...`);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
  }
  throw new Error("PostgreSQL did not become ready in time.");
}

try {
  console.log("Starting PostgreSQL...");
  run("docker", ["compose", "up", "-d", "postgres"], rootDir);
  waitForDatabase();

  console.log("Generating Prisma client...");
  runNpm(["run", "db:generate"], backendDir);

  console.log("Synchronizing database schema...");
  runNpm(["exec", "prisma", "db", "push"], backendDir);

  console.log("Creating the administrator account...");
  runNpm(["run", "db:seed:admin"], backendDir);

  console.log("Starting backend and frontend...");
  const backend = startNpm(["run", "dev"], backendDir);

  setTimeout(() => {
    console.log("Application available at http://localhost:3333");
  }, 1500);

  function shutdown(signal) {
    if (!backend.killed) {
      backend.kill(signal);
    }
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  backend.on("exit", (code) => {
    process.exitCode = code || 0;
  });
} catch (error) {
  console.error(`Failed to start the application: ${error.message}`);
  process.exitCode = 1;
}
