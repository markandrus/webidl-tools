'use strict';

var commander = require('commander');
var ejs = require('ejs');
var File = require('vinyl');
var fs = require('fs');
var h = require('highland');
var parseUrl = require('url').parse;
var path = require('path');
var pkg = require('../package');
var request = require('request');
var StreamConcat = require('stream-concat');
var vfs = require('vinyl-fs');
var winston = require('winston');

var _defaultRenamings = {
  DOMString: 'string',
  DOMTimeStamp: 'number',
  sequence: 'Array',
  'unsigned short': 'number',
  short: 'number',
  'unsigned long': 'number',
  'unsigned long long': 'number',
  long: 'number',
  DOMException: 'Error',
  USVString: 'string',
  DOMHighResTimeStamp: 'number',
  byte: 'number',
  double: 'number',
  float: 'number',
  FrozenArray: 'Array',
  VoidFunction: '() => void',
  object: '{}',
  octet: 'number'
};

var defaultRenamings = [];
for (var regex in _defaultRenamings) {
  defaultRenamings.push([new RegExp('^' + regex + '$'),
    _defaultRenamings[regex]]);
}

/**
 * Add default renamings.
 * @param {object} options
 * @returns {object}
 */
function addDefaultRenamings(options) {
  options.rename = defaultRenamings.concat(options.rename);
  return options;
}

exports.addDefaultRenamings = addDefaultRenamings;

/**
 * Collect definitions by name.
 * @param {Map<string, Array<object>>} collectedDefinitionsByName
 * @param {Map<string, Array<object>>} definitionsByName
 * @returns {Map<string, Array<object>>}
 */
function collectDefinitionsByName(collectedDefinitionsByName,
  definitionsByName) {
  definitionsByName.forEach((definitions, name) => {
    if (!collectedDefinitionsByName.has(name)) {
      collectedDefinitionsByName.set(name, []);
    }
    collectedDefinitionsByName.set(name,
      collectedDefinitionsByName.get(name).concat(definitions));
  });
  return collectedDefinitionsByName;
}

exports.collectDefinitionsByName = collectDefinitionsByName;

/**
 * Return a Stream of Files, starting with any remote files to be fetched over
 * HTTP or HTTPS, and then any local files.
 * @param {Array<string>} filenames
 * @returns {Stream<File>}
 */
function getFiles(filenames) {
  var remote = [];
  var local = [];
  filenames.forEach(filename => {
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
      remote.push(filename);
      return;
    }
    local.push(filename);
  });

  function createRemoteStream(remote) {
    log.info('Sourcing %s', remote);
    return vhttp.src(remote);
  }

  function createLocalStream() {
    log.info('Sourcing %s', local.join(' '));
    return vfs.src(local);
  }

  var finished = false;
  return h(new StreamConcat(function nextStream() {
    if (finished) {
      return null;
    } else if (remote.length) {
      return createRemoteStream(remote.shift());
    }
    finished = true;
    if (local.length) {
      return createLocalStream();
    }
    return null;
  }, { objectMode: true }));
}

exports.getFiles = getFiles;

var hline = repeat('-', 80);

exports.hline = hline;

function loadTemplate(template) {
  var filepath = path.join(__dirname, '..', 'templates');
  var filename = path.join(filepath, template);
  var compiled = ejs.compile(fs.readFileSync(filename).toString(), {
    cache: true,
    filename: filepath
  });
  return function template(data) {
    var merged = Object.assign({
      template: loadTemplate
    }, data);
    return compiled(merged).replace(/\n$/, '');
  };
}

exports.loadTemplate = loadTemplate;

var log = winston;

exports.log = log;

function makeDescription(exports, description) {
  exports.command = {
    description: wrap(description, 27)
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
