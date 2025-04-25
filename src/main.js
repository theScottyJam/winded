#!/usr/bin/env node

import fs from 'node:fs';
import * as glob from 'glob';
import { extractCssAttributes, buildRulesets, buildStylesheet } from './parser.js';

function errorAndExit(message) {
  console.error(message);
  process.exit(1);
}

const args = process.argv.slice(2);
const includes = [];
const excludes = [];
let outputFile = undefined;
let showHelp = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--include') {
    if (args[i + 1] === undefined) {
      errorAndExit('The --include flag requires an argument afterwards.');
    }
    includes.push(args[i + 1]);
    i++; // Skip the value
  } else if (args[i] === '--exclude') {
    if (args[i + 1] === undefined) {
      errorAndExit('The --exclude flag requires an argument afterwards.');
    }
    excludes.push(args[i + 1]);
    i++; // Skip the value
  } else if (args[i] === '--output') {
    if (args[i + 1] === undefined) {
      errorAndExit('The --output flag requires an argument afterwards.');
    }
    if (outputFile !== undefined) {
      errorAndExit('The --output flag can be provided at most one time.');
    }
    outputFile = args[i + 1];
    
    i++; // Skip the value
  } else if (args[i] === '-h' || args[i] === '--help') {
    showHelp = true;
  } else if (args[i].startsWith('--')) {
    errorAndExit(`Unknown argument: ${args[i]}`);
  } else {
    errorAndExit(`Unexpected value "${args[i]}", all values must come after --include or --exclude`);
  }
}

if (showHelp) {
  console.info('USAGE: winded --input <input path> --output <output path> [...other args]');
  console.info();
  console.info('Examples:');
  console.info('  Include all HTML files in src/')
  console.info("    winded --include 'src/**/*.html' --output 'build/styles.css'");
  console.info();
  console.info('  Include all HTML files in the project while ignoring node_modules and build/');
  console.info("    winded --include '**/*.html' --exclude 'node_modules/**' --exclude 'build/**' --output 'build/styles.css'");
  console.info();
  console.info('Arguments:');
  console.info('  --include <glob>');
  console.info('    Include files matching this glob pattern.');
  console.info('    Can be provided multiple times. Must be supplied at least once.');
  console.info();
  console.info('  --exclude <glob>');
  console.info('    Exclude files matching this glob pattern. Excludes take precedence over includes.');
  console.info('    Can be provided multiple times.');
  console.info();
  console.info('  --output <path>');
  console.info('    The output file to write the resulting CSS file to.');
  console.info('    Must be provided exactly once.');
  console.info();
  console.info('  -h, --help');
  console.info('    Show this help message.');
  console.info();
  console.info('Glob pattern tips:');
  console.info('* Always quote your glob patterns to prevent your shell from expanding them.');
  console.info('* Use "/" for your path separator, even on Windows.');
  console.info();
  process.exit(0);
}

if (includes.length === 0) {
  errorAndExit('At least one "--include ..." value is required.');
}

if (outputFile === undefined) {
  errorAndExit('You must specify an "--output ..." argument');
}

const declarationBlocks = [];
const filesStream = glob.streamSync(includes, { ignore: excludes });
filesStream.on('data', file => {
  const fileContents = fs.readFileSync(file, 'utf-8');
  declarationBlocks.push(...extractCssAttributes(fileContents));
});

const stylesheetContents = buildStylesheet(buildRulesets(declarationBlocks));

fs.writeFileSync(outputFile, stylesheetContents, 'utf-8');
