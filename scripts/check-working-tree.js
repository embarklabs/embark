const {execSync} = require('child_process');

try {
  const output = execSync('git status');
  const exitCode = (
    execSync('git status --porcelain').toString().trim() === '' ? 0 : 1
  );
  if (exitCode) console.error(output.toString().trim());
  process.exit(exitCode);
} catch (e) {
  process.exit(1);
}
