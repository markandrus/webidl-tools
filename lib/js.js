'use strict';

var File = require('vinyl');
var h = require('highland');
var log = require('./util').log;
var util = require('./util');
var vfs = require('vinyl-fs');
var webidl = require('./webidl');

/**
 * Generate JavaScript for the given definitions.
 * @param {Map<string, object>} definitionByName
 * @param {object} options
 * @returns {string}
 */
function generateJavaScript(definitionByName, options) {
  log.debug('Generating JavaScript');
  // TODO(mroberts): Implement for real.
  void definitionByName;
  void options;
  return ':-)';
}

/**
 * Package JavaScript into a File.
 * @param {string} javaScript
 * @param {object} options
 * @returns {File}
 */
function toFile(javaScript, options) {
  return new File({
    path: options.out,
    contents: new Buffer(javaScript)
  });
}

/**
 * Run the JavaScript generation pipeline.
 * @param {Array<string>} filenames
 * @param {object} options
 */
function js(filenames, options) {
  util.getFiles(filenames)
    .map(file => webidl.extractDefinitions(file, options))
    .reduce(new Map(), util.collectDefinitionsByName)
    .flatMap(definitionsByName =>
      h([webidl.mergeDefinitionsByName(definitionsByName)]))
    .map(definitionsByName => generateJavaScript(definitionsByName, options))
    .map(javaScript => toFile(javaScript, options))
    .pipe(vfs.dest('.'))
    .resume();
}

module.exports = js;
