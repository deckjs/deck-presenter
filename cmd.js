#!/usr/bin/env node

var master = require('./')()

process.stdin.pipe(master)

master.pipe(process.stdout)

master.stderr.pipe(process.stderr)
