#!/usr/bin/env ts-node
/**
 * Build Verification Script
 *
 * This script verifies that the Next.js application builds successfully
 * without any errors. It's used in CI/CD and pre-deployment checks.
 *
 * Usage: npm run verify-build
 */

import { spawn } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface BuildResult {
  success: boolean;
  exitCode: number;
  output: string;
  errors: string[];
}

/**
 * Run the Next.js build command and collect results
 */
async function runBuild(): Promise<BuildResult> {
  return new Promise((resolve) => {
    console.log('🔨 Starting Next.js build verification...\n');

    const buildProcess = spawn('npm', ['run', 'build'], {
      cwd: path.resolve(__dirname, '..'),
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'production',
      },
    });

    let stdout = '';
    let stderr = '';

    buildProcess.stdout?.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      process.stdout.write(text);
    });

    buildProcess.stderr?.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      process.stderr.write(text);
    });

    buildProcess.on('close', (code) => {
      const output = stdout + stderr;
      const errors = extractErrors(output);

      resolve({
        success: code === 0,
        exitCode: code || 0,
        output,
        errors,
      });
    });

    buildProcess.on('error', (error) => {
      resolve({
        success: false,
        exitCode: 1,
        output: error.message,
        errors: [error.message],
      });
    });
  });
}

/**
 * Extract error messages from build output
 */
function extractErrors(output: string): string[] {
  const errors: string[] = [];
  const lines = output.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // TypeScript errors
    if (line.includes('error TS')) {
      errors.push(line.trim());
    }

    // ESLint errors
    if (line.includes('✖') || line.match(/\d+ error/)) {
      errors.push(line.trim());
    }

    // Next.js build errors
    if (line.includes('Error:') || line.includes('Failed to compile')) {
      errors.push(line.trim());
    }

    // Module not found
    if (line.includes("Module not found") || line.includes("Cannot find module")) {
      errors.push(line.trim());
    }
  }

  return errors;
}

/**
 * Print build summary
 */
function printSummary(result: BuildResult): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊 BUILD VERIFICATION SUMMARY');
  console.log('='.repeat(60));

  if (result.success) {
    console.log('✅ Status: SUCCESS');
    console.log('✅ Build completed with no errors');
  } else {
    console.log('❌ Status: FAILED');
    console.log(`❌ Exit code: ${result.exitCode}`);

    if (result.errors.length > 0) {
      console.log(`\n🐛 Found ${result.errors.length} error(s):`);
      result.errors.forEach((error, index) => {
        console.log(`\n${index + 1}. ${error}`);
      });
    }
  }

  console.log('='.repeat(60) + '\n');
}

/**
 * Main execution
 */
async function main() {
  try {
    const result = await runBuild();
    printSummary(result);

    // Exit with appropriate code
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('❌ Unexpected error during build verification:', error);
    process.exit(1);
  }
}

// Run if executed directly
main();

export { runBuild };
export type { BuildResult };
