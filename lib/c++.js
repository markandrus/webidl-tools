'use strict';

var File = require('vinyl');
var h = require('highland');
var log = require('./util').log;
var path = require('path');
var util = require('./util');
var vfs = require('vinyl-fs');
var webidl = require('./webidl');

var headerTemplate = util.loadTemplate('c++/header.ejs');
var cppTemplate = util.loadTemplate('c++/cc.ejs');

function memberType(member) {
  var ret = '';
  if (!member.required && !member.idlType.nullable) {
    ret += 'Nan::Maybe<';
  }
  ret += type(member.idlType);
  if (!member.required && !member.idlType.nullable) {
    ret += '>';
  }
  return ret;
}

function type(idlType) {
  var ret = '';
  if (idlType.nullable) {
    ret += 'Nan::Maybe<';
  }
  if (idlType.sequence || idlType.generic === 'Array') {
    ret += 'std::vect<';
  }
  ret += idlType.idlType;
  if (idlType.sequence || idlType.generic === 'Array') {
    ret += '>';
  }
  if (idlType.nullable) {
    ret += '>';
  }
  return ret;
}

/**
 * Generate a .h file for the given definitions.
 * @param {object} definition
 * @param {object} options
 * @returns {[string, string]}
 */
function generateHeader(definition, options) {
  var headerName = definition.name.toLowerCase() + '.h';
  log.debug('Generating ' + path.join(options.out, headerName));
  return [
    headerName,
    headerTemplate({
      memberType: memberType,
      namespace: options.namespace,
      node: definition,
      type: type
    })
  ];
}

/**
 * Generate a .cpp file for the given definitions.
 * @param {object} definition
 * @param {object} options
 * @returns {[string, string]}
 */
function generateCpp(definition, options) {
  var cppName = definition.name.toLowerCase() + '.' + options.suffix;
  var headerName = definition.name.toLowerCase() + '.h';
  log.debug('Generating ' + path.join(options.out, cppName));
  return [
    cppName,
    cppTemplate({
      header: headerName,
      namespace: options.namespace,
      node: definition
    })
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
      h(webidl.mergeDefinitionsByName(definitionsByName, options)));

  definitions
    .fork()
    .map(definition => generateHeader(definition, options))
    .map(file => toFile(file, options))
    .pipe(vfs.dest(options.out))
    .resume();

  definitions
    .fork()
    .map(definition => generateCpp(definition, options))
    .map(file => toFile(file, options))
    .pipe(vfs.dest(options.out))
    .resume();
}

module.exports = cpp;
