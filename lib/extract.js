'use strict';

var cheerio = require('cheerio');
var File = require('vinyl');
var h = require('highland');
var log = require('./util').log;
var util = require('./util');
var vfs = require('vinyl-fs');
var webidl = require('./webidl');

/**
 * Extract definitions by name from a File.
 * @param {File} file - the file to extract from
 * @param {object} options
 * @returns {Map<string, Array<object>>}
 */
function extractDefinitions(file, options) {
  log.debug('Extracting definitions from %s', file.path);

  var $;
  try {
    var $ = cheerio.load(file.contents.toString());
  } catch (error) {
    log[options.bail ? 'error' : 'warn'](
      'Unable to parse HTML: %s', file.path);
    if (options.bail) {
      process.exit(1);
    }
    return new Map();
  }

  return $('.idl').toArray().map(node => {
    var unparsed;
    switch (node.name) {
      case 'dl':
        unparsed = extractDefinitionFromDl($, node);
        break;
      case 'pre':
        unparsed = extractDefinitionFromPre($, node);
        break;
      default:
        log.warn('I don\'t know how to parse WebIDL from <' + node.name +
          '> tags');
        return new Map();
    }
    return webidl.extractDefinitions(unparsed, options);
  }).reduce(util.collectDefinitionsByName, new Map());
}

/**
 * Extract an unparsed definition from a &lt;dl&gt; node.
 * @param {object} $ - cheerio
 * @param {object} dl - the &lt;dl&gt; node
 * @returns {string}
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

  return definition;
}

/**
 * Extract an unparsed definition from a &lt;pre&gt; node.
 * @param {object} $ - cheerio
 * @param {object} pre - the &lt;pre&gt; node
 * @returns {string}
 */
function extractDefinitionFromPre($, pre) {
  return $(pre).text();
}

/**
 * Separate definitions into into Files.
 * @param {Map<string, Array<object>>} definitionsByName
 * @returns {Stream<File>}
 */
function toFiles(definitionsByName) {
  var files = [];
  definitionsByName.forEach((definitions, name) => {
    var contents = definitions.map(definition =>
      webidl.write([definition])).join('\n');
    var cwd = process.cwd();
    var file = new File({
      path: name.toLowerCase() + '.idl',
      contents: new Buffer(contents)
    });
    files.push(file);
  });
  return h(files);
}

/**
 * Run the WebIDL extraction pipeline.
 * @param {Array<string>} filenames
 * @param {object} options
 */
function extract(filenames, options) {
  util.getFiles(filenames)
    .map(file => extractDefinitions(file, options))
    .reduce(new Map(), util.collectDefinitionsByName)
    .flatMap(definitionsByName =>
      h([webidl.maybeMergeDefinitionsByName(definitionsByName, options)]))
    .flatMap(toFiles)
    .pipe(vfs.dest(options.out))
    .resume();
}

module.exports = extract;
