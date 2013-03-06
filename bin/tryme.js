#!/usr/bin/env node
// simple server for previewing a single project
// usage: tryme [options] /path/to/tryme/folder

var argv = require('optimist').argv;

var server = require("./server")

server(argv)
