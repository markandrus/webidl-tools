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
function replace(match, replacement, definition) {
  if (definition.generic) {
    definition.generic = definition.generic.replace(match, replacement);
  }
  if (definition.idlType) {
    if (typeof definition.idlType === 'string') {
      definition.idlType = definition.idlType.replace(match, replacement);
    } else if (definition.idlType instanceof Array) {
      definition.idlType = definition.idlType.map(idlType => {
        return replace(match, replacement, idlType);
      });
    } else {
      definition.idlType = replace(match, replacement, definition.idlType);
    }
  }
  if (definition.name) {
    definition.name = definition.name.replace(match, replacement);
  }
  if (definition.members) {
    definition.members = definition.members.map(member => {
      return replace(match, replacement, member);
    });
  }
  if (definition.inheritance) {
    definition.inheritance = definition.inheritance.replace(match, replacement);
  }
  if (definition.arguments) {
    definition.arguments = definition.arguments.map(argument => {
      return replace(match, replacement, argument);
    });
  }
  if (definition.default) {
    definition.default = replace(match, replacement, definition.default);
  }
  if (definition.target) {
    definition.target = definition.target.replace(match, replacement);
  }
  if (definition.implements) {
    definition.implements = definition.implements.replace(match, replacement);
  }
  if (definition.iteratorObject) {
    definition.iteratorObject =
      definition.iteratorObject.replace(match, replacement);
  }
  if (definition.extAttrs) {
    definition.extAttrs = definition.extAttrs.map(extAttr => {
      return replace(match, replacement, extAttr);
    });
  }
  if (definition.typeExtAttrs) {
    definition.typeExtAttrs = definition.typeExtAttrs.map(typeExtAttr => {
      return replace(match, replacement, typeExtAttr);
    });
  }
  return definition;
}

exports.replace = replace;

var parse = webidl2.parse;

exports.parse = parse;
