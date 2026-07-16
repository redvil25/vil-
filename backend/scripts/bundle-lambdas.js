const esbuild = require('esbuild');
const { readdir, stat } = require('fs/promises');
const path = require('path');

const HANDLERS_DIR = path.join(__dirname, '../dist/handlers');
const OUTPUT_DIR = path.join(__dirname, '../dist/bundles');

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Recursively find all handler files in directory and subdirectories
 */
async function findHandlerFiles(dir, basePath = '') {
  const handlers = [];
  const files = await readdir(dir, { withFileTypes: true });

  for (const file of files) {
    const relativePath = basePath ? `${basePath}/${file.name}` : file.name;
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      // Recursively search subdirectories
      const subHandlers = await findHandlerFiles(fullPath, relativePath);
      handlers.push(...subHandlers);
    } else if (file.name.endsWith('.js')) {
      handlers.push({
        relativePath,
        fullPath,
        name: file.name.replace('.js', ''),
      });
    }
  }

  return handlers;
}

async function bundleLambdas() {
  console.log('Bundling Lambda functions with esbuild...\n');

  try {
    // Get all handler files (including subdirectories)
    const handlers = await findHandlerFiles(HANDLERS_DIR);

    if (handlers.length === 0) {
      console.log('Warning: No handlers found in dist/handlers/');
      console.log('   Make sure to run TypeScript compilation first');
      return;
    }

    console.log(`Found ${handlers.length} handlers to bundle:\n`);

    const bundleStats = [];

    for (const handler of handlers) {
      const handlerName = handler.name;
      const entryPoint = handler.fullPath;
      const outfile = path.join(OUTPUT_DIR, handlerName, 'index.js');

      console.log(`  Bundling ${handlerName}...`);

      const result = await esbuild.build({
        entryPoints: [entryPoint],
        bundle: true,
        platform: 'node',
        target: 'node20',
        outfile: outfile,
        external: ['@aws-sdk/*', 'aws-sdk'],
        minify: true,
        sourcemap: false,
        logLevel: 'error',
        treeShaking: true,
        metafile: true,
      });

      // Get bundle size
      const stats = await stat(outfile);
      bundleStats.push({
        name: handlerName,
        size: stats.size,
        sizeFormatted: formatBytes(stats.size),
      });

      console.log(`     OK: ${handlerName}/index.js created (${formatBytes(stats.size)})`);
    }

    console.log('\nAll Lambda functions bundled successfully!');
    console.log(`Bundles available in: ${OUTPUT_DIR}\n`);

    // Display bundle size summary
    console.log('Bundle Size Summary:');
    console.log('-'.repeat(50));
    bundleStats.forEach((stat) => {
      const statusIcon = stat.size > 2 * 1024 * 1024 ? 'WARN' : 'OK  ';
      console.log(`${statusIcon} ${stat.name.padEnd(25)} ${stat.sizeFormatted.padStart(10)}`);
    });
    console.log('-'.repeat(50));

    const totalSize = bundleStats.reduce((acc, stat) => acc + stat.size, 0);
    console.log(`     ${'TOTAL'.padEnd(25)} ${formatBytes(totalSize).padStart(10)}\n`);

    // Warn about large bundles
    const largeBundles = bundleStats.filter((stat) => stat.size > 2 * 1024 * 1024);
    if (largeBundles.length > 0) {
      console.log('Warning: The following bundles exceed 2MB:');
      largeBundles.forEach((stat) => {
        console.log(`   - ${stat.name}: ${stat.sizeFormatted}`);
      });
      console.log('   Consider using Lambda layers for shared dependencies.\n');
    }
  } catch (error) {
    console.error('Error bundling Lambda functions:', error);
    process.exit(1);
  }
}

bundleLambdas();
