'use strict';

var File = require('vinyl');
var FlowTemplate = require('./template');
var h = require('highland');
var log = require('../util').log;
var path = require('path');
var util = require('../util');
var vfs = require('vinyl-fs');
var webidl = require('../webidl');

/**
 * Generate a Flow type declaration for the given definition.
 * @param {object} definitions
 * @returns {object}
 */
function generateDeclaration(definition) {
  log.debug('Generting Flow type declaration for %s', definition.name);
  return {
    name: definition.name,
    declaration: new FlowTemplate({
      node: definition
    }).toString()
  };
}

/**
 * Package a Flow type declaration into a File.
 * @param {object} declaration
 * @returns {File}
 */
function toFile(declaration) {
  return new File({
    path: declaration.name.toLowerCase() + '.js',
    contents: new Buffer(declaration.declaration)
  });
}

/**
 * Run the Flow type declaration generation pipeline.
 * @param {Array<string>} filenames
 * @param {object} options
 */
function flow(filenames, options) {
  options = util.addDefaultJavaScriptRenamings(options);
  util.getFiles(filenames)
    .map(file => webidl.extractDefinitions(file, options))
    .reduce(new Map(), util.collectDefinitionsByName)
    .flatMap(definitionsByName =>
      h(webidl.mergeDefinitionsByName(definitionsByName, options)))
    .map(generateDeclaration)
    .map(toFile)
    .pipe(vfs.dest(options.out))
    .resume();
}

module.exports = flow;
