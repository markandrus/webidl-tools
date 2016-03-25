'use strict';

var cheerio = require('cheerio');
var File = require('vinyl');
var h = require('highland');
var log = require('./util').log;
var path = require('path');
var StreamConcat = require('stream-concat');
var util = require('./util');
var vfs = require('vinyl-fs');
var vhttp = require('./util').vhttp;
var webidl2 = require('webidl2');

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

/**
 * Extract definitions by name from a File.
 * @param {File} file - the file to extract from
 * @returns {Map<string, Array<object>>}
 */
function extractDefinitions(file) {
  log.info('Extracting definitions from %s', file.path);
  var $ = cheerio.load(file.contents.toString());
  return $('.idl').toArray().reduce((definitionsByName, node) => {
    var definition;
    switch (node.name) {
      case 'dl':
        definition = extractDefinitionFromDl($, node);
        break;
      case 'pre':
        definition = extractDefinitionFromPre($, node);
        break;
      default:
        log.warn('I don\'t know how to parse WebIDL from <' + node.name +
          '> tags');
        return definitionsByName;
    }
    try {
      definition.parsed = webidl2.parse(definition.unparsed);
    } catch (error) {
      log.warn('Unable to parse WebIDL\n%s\n%s\n%s\n%s', util.hline,
        definition.unparsed, util.hline, error.toString());
      return definitionsByName;
    }
    var name = definition.parsed[0].name;
    log.debug('Parsed WebIDL for %s\n%s\n%s\n%s', name, util.hline,
      definition.unparsed, util.hline);
    if (!definitionsByName.has(name)) {
      definitionsByName.set(name, []);
    }
    definitionsByName.get(name).push(definition);
    return definitionsByName;
  }, new Map());
}

/**
 * Extract an unparsed definition from a &lt;dl&gt; node.
 * @param {object} $ - cheerio
 * @param {object} dl - the &lt;dl&gt; node
 * @returns {object}
 */
function extractDefinitionFromDl($, dl) {
  var title = $(dl).attr('title');

  // Parsing the unrended <dl> nodes is pretty crude.
  var isCallbackOrCallbackInterface = Boolean(title.match(/^callback /))
    && !title.match(/^callback interface/);
  var isEnum = Boolean(title.match(/^enum /));
  var isTypedef = Boolean(title.match(/^typedef /));

  var definition;
  if (isCallbackOrCallbackInterface) {
    definition = title + '(' + $('dt', dl).toArray().map(function(dt) {
      return $(dt).text();
    }).join(', ') + ');';
  } else if (isEnum) {
    definition = title + ' {\n' + $('dt', dl).toArray().map(function(dt) {
      return '    "' + $(dt).text() + '"';
    }).join(',\n') + '\n};';
  } else if (isTypedef) {
    definition = title + ';';
  } else {
    definition = title + ' {\n' + $('dt', dl).toArray().map(function(dt) {
      return '    ' + $(dt).text() + ';';
    }).join('\n') + '\n};';
  }

  return { unparsed: definition };
}

/**
 * Extract an unparsed definition from a &lt;pre&gt; node.
 * @param {object} $ - cheerio
 * @param {object} pre - the &lt;pre&gt; node
 * @returns {object}
 */
function extractDefinitionFromPre($, pre) {
  return { unparsed: $(pre).text() };
}

/**
 * Combine definitions by name.
 * @param {Map<string, Array<object>>} combinedDefinitionsByName
 * @param {Map<string, Array<object>>} definitionsByName
 * @returns {Map<string, Array<object>>}
 */
function combineDefinitions(combinedDefinitionsByName, definitionsByName) {
  definitionsByName.forEach((definitions, name) => {
    if (!combinedDefinitionsByName.has(name)) {
      combinedDefinitionsByName.set(name, []);
    }
    combinedDefinitionsByName.set(name,
      combinedDefinitionsByName.get(name).concat(definitions));
  });
  return combinedDefinitionsByName;
}

/**
 * Separate definitions into into Files.
 * @param {Map<string, Array<object>>} definitionsByName
 * @returns {Stream<File>}
 */
function toFiles(definitionsByName) {
  var files = [];
  definitionsByName.forEach((definitions, name) => {
    var contents = definitions.map(definition => {
      return definition.unparsed;
    }).join('\n\n');
    var cwd = process.cwd();
    var file = new File({
      path: name.toLowerCase() + '.idl',
      contents: new Buffer(contents)
    });
    files.push(file);
  });
  files = files.sort((a, b) => a.path.localeCompare(b.path));
  log.info('Writing %s files:\n\n\t%s\n', files.length,
    files.map(file => file.path).join('\n\t'));
  return h(files);
}

/**
 * Run the WebIDL extraction pipeline.
 * @param {Array<string>} filenames
 * @param {object} options
 */
function extract(filenames, options) {
  getFiles(filenames)
    .map(extractDefinitions)
    .reduce(new Map(), combineDefinitions)
    .flatMap(toFiles)
    .pipe(vfs.dest(options.out))
    .resume();
}

module.exports = extract;
