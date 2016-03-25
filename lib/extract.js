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
 * @returns {Map<string, Array<object>>}
 */
function extractDefinitions(file) {
  log.debug('Extracting definitions from %s', file.path);
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
      definition.parsed = webidl.parse(definition.unparsed)[0];
    } catch (error) {
      log.warn('Unable to parse WebIDL\n%s\n%s\n%s\n%s', util.hline,
        definition.unparsed, util.hline, error.toString());
      return definitionsByName;
    }
    var name = definition.parsed.name;
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
  return h(files);
}

/**
 * Run the WebIDL extraction pipeline.
 * @param {Array<string>} filenames
 * @param {object} options
 */
function extract(filenames, options) {
  util.getFiles(filenames)
    .map(extractDefinitions)
    .reduce(new Map(), util.collectDefinitionsByName)
    .flatMap(toFiles)
    .pipe(vfs.dest(options.out))
    .resume();
}

module.exports = extract;
