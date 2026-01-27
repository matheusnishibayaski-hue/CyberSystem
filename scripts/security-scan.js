const { execSync } = require('child_process');
const path = require('path');

// Get Python Scripts directory
const pythonPath = execSync('where python', { encoding: 'utf-8' }).trim().split('\n')[0];
const pythonDir = path.dirname(pythonPath);
const scriptsDir = path.join(pythonDir.replace('bin', 'pythoncore-3.14-64'), 'Scripts');

// Add to PATH temporarily
const originalPath = process.env.PATH;
process.env.PATH = `${scriptsDir};${originalPath}`;

try {
  console.log('Running Semgrep security scan...\n');
  execSync('semgrep --config=security/semgrep.yml src/', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
} catch (error) {
  // Semgrep exits with code 1 if issues are found, which is expected
  if (error.status === 1) {
    console.log('\n⚠️  Security issues found. Please review the output above.');
    process.exit(1);
  } else {
    console.error('Error running Semgrep:', error.message);
    process.exit(1);
  }
}
