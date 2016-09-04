'use strict';

var ejs = require('ejs');
var fs = require('fs');
var path = require('path');

/**
 * Construct a {@link Template}.
 * @class
 * @classdesc {@link Template} is used to print values in templates. It receives
 * the full list of WebIDL definitions so that enumerations and other types
 * can be looked up from functions like {@link Template#toEnum}.
 * @param {object} [options]
 */
function Template(options) {
  options = Object.assign({
    definitions: new Map()
  }, options);
  var compiled = ejs.compile(fs.readFileSync(options.template).toString(), {
    cache: true,
    filename: options.template
  });
  Object.defineProperties(this, {
    _compiled: {
      value: compiled
    },
    _dictionaries: {
      value: new Set()
    },
    _enums: {
      value: new Map()
    },
    _options: {
      value: options
    }
  });
  options.definitions.forEach(node => {
    switch (node.type) {
      case 'dictionary':
        this._dictionaries.add(node.name);
        break;
      case 'enum':
        this._enums.set(node.name, new Set(node.values));
        break;
    }
  });
}

/**
 * Include a template (relative to the current).
 * @param {object} [options]
 * @returns {string}
 */
Template.prototype.include = function include(options) {
  options = Object.assign({}, this._options, options);
  if (options.template && !path.isAbsolute(options.template)) {
    options.template = path.join(path.dirname(this._options.template), options.template);
  }
  var This = this.constructor;
  var newTemplate = new This(options);
  return newTemplate._compiled(newTemplate).replace(/\n$/, '');
};

/**
 * Check if a type name corresponds to a WebIDL dictionary.
 * @param {string} type
 * @returns {boolean}
 */
Template.prototype.isDictionary = function isDictionary(type) {
  return this._dictionaries.has(type);
};

/**
 * Check if a type name corresponds to a WebIDL enum.
 * @param {string} type
 * @returns {boolean}
 */
Template.prototype.isEnum = function isEnum(type) {
  return this._enums.has(type);
};

/**
 * Return a boolean literal.
 * @param {boolean} value
 * @returns {string}
 */
Template.prototype.toBoolean = function toBoolean(value) {
  return value ? 'true' : 'false';
};

/**
 * Return an enum literal.
 * @param {string} type
 * @param {string} value
 * @returns {string}
 * @throws Error
 */
Template.prototype.toEnum = function toEnum(type, value) {
  if (!this._enums.get(type).has(value)) {
    throw new Error('Value "' + value + '" is not a valid ' + type);
  }
  return this.toStringLiteral(value);
};

/**
 * Return a literal.
 * @param {string} type
 * @param {*} value
 * @returns {string}
 */
Template.prototype.toLiteral = function toLiteral(type, value) {
  if (this.isEnum(type)) {
    return this.toEnum(type, value);
  }
  throw new Error('Unknown type "' + type + '" and value "' + value + '"');
};

Template.prototype.toString = function toString() {
  return this._compiled(this).replace(/\n$/, '');
};

/**
 * Retrun a string literal.
 * @param {string} value
 * @returns {string}
 */
Template.prototype.toStringLiteral = function toStringLiteral(value) {
  return "'" + value + "'";
};

module.exports = Template;
