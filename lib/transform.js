'use strict';

var DefaultTemplate = require('./template');
var File = require('vinyl');
var h = require('highland');
var inherits = require('util').inherits;
var path = require('path');
var util = require('./util');
var vfs = require('vinyl-fs');
var webidl = require('./webidl');

/**
 * Construct a {@link Transform}.
 * @class
 * @classdesc A {@link Transform} transforms WebIDL definitions, often into
 * another representation.
 * @param {object} [options]
 * @property {object} options
 * @property {string} out
 * @property {Template} template
 */
function Transform(options) {
  options = Object.assign({
    out: '.',
    Template: null,
    transform: __dirname
  }, options);

  var Template = options.Template;
  if (!(Template instanceof DefaultTemplate)) {
    Template = require(path.join(options.transform, 'template'));
  }

  Object.defineProperties(this, {
    options: {
      enumerable: true,
      value: options
    },
    out: {
      enumerable: true,
      value: options.out
    },
    Template: {
      enumerable: true,
      value: Template
    }
  });
}

/**
 * Create a custom {@link Transform}.
 * @param {string} transform
 * @param {object} [overrides]
 * @returns {Transform}
 */
Transform.create = function create(transform, overrides) {
  function CustomTransform(options) {
    if (!(this instanceof CustomTransform)) {
      return new CustomTransform(options);
    }
    options = Object.assign({}, options, {
      transform: transform
    });
    Transform.call(this, options);
  }

  inherits(CustomTransform, Transform);

  Object.assign(CustomTransform.prototype, overrides);

  return CustomTransform;
};

/**
 * Run the {@link Transform} over `filenames`.
 * @param {Array<string>} filenames
 * @returns {Stream<undefned>}
 */
Transform.prototype.run = function run(filenames) {
  var definitions = util.getFiles(filenames)
    .map(file => webidl.extractDefinitions(file, this.options))
    .reduce(new Map(), util.collectDefinitionsByName)
    .flatMap(definitionsByName =>
      h(webidl.mergeDefinitionsByName(definitionsByName, this.options)))
    .collect()
    .flatMap(definitions => this.transform(definitions))
    .map(pair => this.toFile(pair[0], pair[1]))
    .pipe(vfs.dest(this.out))
    .resume();
};

/**
 * Write contents to filename.
 * @param {string} filename
 * @param {string} contents
 * @returns {File}
 */
Transform.prototype.toFile = function toFile(filename, contents) {
  return new File({
    path: filename,
    contents: new Buffer(contents)
  });
};

/**
 * Transform WebIDL definitions.
 * @param {Array<object>} definitions
 * @returns {Stream<[string, string]>}
 */
Transform.prototype.transform = function process(definitions) {
  // Example 1: Process definitions individually
  // -------------------------------------------
  //
  // In this example, we write each WebIDL definitions' name to a file.
  //
  var individually = h(definitions.map(definition => [
    definition.name.toLowerCase() + '.example',
    definition.name
  ]));

  // Example 2: Write definitions to the same file
  // ---------------------------------------------
  //
  // In this example, we write each WebIDL definitions' name to the same file.
  //
  var together = h([
    'combined.example',
    definitions.map(definition => definition.name).join('\n')
  ]);

  // Example 3: Write multiple files for each definition
  // ---------------------------------------------------
  //
  // This example builds on the subsequent two, showing you how to write
  // multiple files for each WebIDL definition (useful, for example, when
  // writing header and implementation files).
  //
  return h([
    individually,
    together
  ]).sequence();
};

module.exports = Transform;
