'use strict';

var log = require('./util').log;
var util = require('./util');
var webidl2 = require('webidl2');

/**
 * Extract definitions by name from a File.
 * @param {File} file - the file to extract from
 * @param {object} options
 * @returns {Map<string, Array<object>>}
 */
function extractDefinitions(file, options) {
  log.debug('Extracting definitions from %s', file.path);
  var definitionsByName = new Map();
  var unparsed = file.contents.toString();
  var parsed;
  try {
    parsed = parse(unparsed)[0];
  } catch (error) {
    log.warn('Unabled to parse WebIDL\n%s\n%s\n%s\n%s', util.hline, unparsed,
      util.hline, error.toString());
    return definitionsByName;
  }
  var name = parsed.name;
  log.debug('Parsed WebIDL for %s\n%s\n%s\n%s', name, util.hline,
    unparsed, util.hline);
  if (options.match) {
    if (options.skip && name.match(options.match)) {
      log.debug('Skipping %s', name);
      return definitionsByName;
    }
    if (options.replace) {
      log.debug('Replacing names');
      parsed = replace(options.match, options.replace, parsed);
    }
  }
  if (!definitionsByName.has(name)) {
    definitionsByName.set(name, []);
  }
  definitionsByName.get(name).push(parsed);
  return definitionsByName;
}

exports.extractDefinitions = extractDefinitions;

/**
 * Merge partial definitions, dictionaries, etc. Method return and parameter
 * types will be merged into unions.
 * @param {Map<string, Array<object>>} definitionsByName
 * @returns {Array<object>}
 */
function mergeDefinitionsByName(definitionsByName) {
  // TODO(mroberts): Implement for real.
  return Array.from(definitionsByName.values()).map(definitions => {
    return definitions[0];
  });
}

exports.mergeDefinitionsByName = mergeDefinitionsByName;

/**
 * Replace names in a definition.
 * @param {RegEx} match
 * @param {string} replace
 * @param {object} definition
 * @returns {object}
 */
function replace(match, replace, definition) {
  void match;
  void replace;
  return definition;
}

exports.replace = replace;

var parse = webidl2.parse;

exports.parse = parse;
