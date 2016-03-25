'use strict';

var commander = require('commander');
var ejs = require('ejs');
var File = require('vinyl');
var h = require('highland');
var parseUrl = require('url').parse;
var path = require('path');
var pkg = require('../package');
var request = require('request');
var winston = require('winston');

var hline = repeat('-', 80);

exports.hline = hline;

function loadTemplate(type, teamplate) {
  var filename = path.join(__dirname, '..', 'templates', type, template);
  return ejs.compile(fs.readFileSync(filename).toString(), {
    filename: filename
  });
}

exports.loadTemplate = loadTemplate;

var log = winston;

exports.log = log;

function makeDescription(exports, description) {
  exports.command = {
    description: wrap(description, 27) + '\n'
  };
}

exports.makeDescription = makeDescription;

function program(exports, description) {
  makeDescription(exports, description);
  return commander
    .version(pkg.version)
    .description(wrap(description, 2));
}

exports.program = program;

function repeat(str, n) {
  return new Array(n + 1).join(str);
}

exports.repeat = repeat;

function split(str, length) {
  var before = '';
  var after = '';
  var metLength = false;
  str.split(' ').forEach(function(word) {
    if (!metLength && before.length + 1 + word.length < length) {
      before += (before ? ' ' : '') + word;
    } else {
      metLength = true;
      after += (after ? ' ' : '') + word;
    }
  });
  return [before, after];
}

exports.split = split;

var vhttp = {
  src: vhttpSrc
};

function vhttpSrc(urls) {
  if (urls instanceof Array) {
    return h(Promise.all(urls.map(vhttpSrc)));
  }
  var url = urls;
  return h(new Promise(function requestPromise(resolve, reject) {
    request(url, function handleResponse(error, response, body) {
      if (error) {
        reject(error);
        return;
      }
      var parsed = parseUrl(url);
      var file = new File({
        cwd: process.cwd(),
        base: parsed.host,
        path: url,
        contents: new Buffer(body)
      });
      resolve(file);
    });
  }));
}

exports.vhttp = vhttp; 

function wrap(str, offset, width) {
  if (typeof offset !== 'number') {
    offset = 0;
  }

  if (typeof width !== 'number') {
    width = 80;
  }

  if (offset >= width) {
    throw new Error('Offset must be less than width');
  }

  if (str.length + offset <= width) {
    return str;
  }

  var parts = split(str, width - offset);
  return parts[0] + '\n' + repeat(' ', offset) + wrap(parts[1], offset, width);
}

exports.wrap = wrap;
