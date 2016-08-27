'use strict';

var CppTemplate = require('./template');
var File = require('vinyl');
var h = require('highland');
var log = require('../util').log;
var path = require('path');
var util = require('../util');
var vfs = require('vinyl-fs');
var webidl = require('../webidl');

/**
 * Generate a .h file for the given definitions.
 * @param {Array<object>} definitions
 * @param {object} definition
 * @param {object} options
 * @returns {[string, string]}
 */
function generateHeader(definitions, definition, options) {
  var headerName = definition.name.toLowerCase() + '.h';
  log.debug('Generating ' + path.join(options.out, headerName));
  return [
    headerName,
    new CppTemplate({
      definitions: definitions,
      namespace: options.namespace,
      node: definition,
      template: path.join(__dirname, 'templates/index.h.ejs')
    }).toString()
  ];
}

/**
 * Generate a .cpp file for the given definitions.
 * @param {Array<object>} definitions
 * @param {object} definition
 * @param {object} options
 * @returns {[string, string]}
 */
function generateCpp(definitions, definition, options) {
  var cppName = definition.name.toLowerCase() + '.' + options.suffix;
  var headerName = definition.name.toLowerCase() + '.h';
  log.debug('Generating ' + path.join(options.out, cppName));
  return [
    cppName,
    new CppTemplate({
      definitions: definitions,
      namespace: options.namespace,
      node: definition,
      template: path.join(__dirname, 'templates/index.cc.ejs')
    }).toString()
  ];
}

/**
 * Package a .h or .cpp file name and contents into a File.
 * @param {[string, string]} fileNameAndContents
 * @param {object} options
 * @returns {File}
 */
function toFile(fileNameAndContents, options) {
  return new File({
    path: fileNameAndContents[0],
    contents: new Buffer(fileNameAndContents[1])
  });
}

/**
 * Run the .h and .cpp generation pipeline.
 * @param {Array<string>} filenames
 * @param {object} options
 */
function cpp(filenames, options) {
  options = util.addDefaultCPPRenamings(options);
  var definitions = util.getFiles(filenames)
    .map(file => webidl.extractDefinitions(file, options))
    .reduce(new Map(), util.collectDefinitionsByName)
    .flatMap(definitionsByName =>
      h(webidl.mergeDefinitionsByName(definitionsByName, options)))
    .collect();

  definitions
    .fork()
    .map(definitions => definitions.map(definition =>
      generateHeader(definitions, definition, options)))
    .flatMap(files => files.map(file => toFile(file, options)))
    .pipe(vfs.dest(options.out))
    .resume();

  definitions
    .fork()
    .map(definitions => definitions.map(definition =>
      generateCpp(definitions, definition, options)))
    .flatMap(files => files.map(file => toFile(file, options)))
    .pipe(vfs.dest(options.out))
    .resume();
}

module.exports = cpp;
