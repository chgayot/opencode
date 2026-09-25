// 1. Force the working directory to be this root folder
process.chdir(import.meta.dir);

// 2. Import the actual script.
// Bun will automatically resolve dependencies from packages/opencode/node_modules
await import("./packages/opencode/src/index.ts");
