#!/usr/bin/env node

import * as path from 'node:path';
import * as fs from 'node:fs';
import * as process from 'node:process';
import { parse, write } from './lib/index.js';

const fileArg = process.argv[2];

if (!fileArg) {
  logError('missing SDP file argument');

  process.exit(1);
}

const file = path.join(process.cwd(), process.argv[2]);
const sdp = fs.readFileSync(file).toString();
const parsed = parse(sdp);
const written = write(parsed);
const writtenLines = written.split('\r\n');
const origLines = sdp.split('\r\n');

let numMissing = 0;
let numNew = 0;
let parseFails = 0;

for (const media of parsed.media) {
  for (const invalid of media.invalid ?? []) {
    logWarn(`unrecognized a=${invalid.value} belonging to m=${media.type}`);

    parseFails++;
  }
}

const parseStr = `${parseFails} unrecognized line(s) copied blindly`;

for (const [i, line] of origLines.entries()) {
  if (writtenLines.indexOf(line) < 0) {
    logError(`l${i} lost (${line})`);

    numMissing++;
  }
}

for (const [i, line] of writtenLines.entries()) {
  if (origLines.indexOf(line) < 0) {
    logError(`l${i} new (${line})`);

    numNew++;
  }
}

const failed = numMissing > 0 || numNew > 0;

if (failed) {
  logWarn(`${file} changes during transform:`);
  logWarn(
    `${numMissing} missing line(s), ${numNew} new line(s)%s`,
    parseFails > 0 ? `, ${parseStr}` : ''
  );
} else {
  logInfo(`${file} verified%s`, parseFails > 0 ? `, but had ${parseStr}` : '');
}

process.exit(failed ? 1 : 0);

function logInfo(...args) {
  // eslint-disable-next-line no-console, no-undef
  console.log(`\x1b[36m[INFO]\x1b[0m`, ...args);
}

function logWarn(...args) {
  // eslint-disable-next-line no-console, no-undef
  console.warn(`\x1b[33m[WARN]\x1b\0m`, ...args);
}

function logError(...args) {
  // eslint-disable-next-line no-console, no-undef
  console.error(`\x1b[31m[ERROR]\x1b[0m`, ...args);
}
