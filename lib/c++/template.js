'use strict';

var Template = require('../template');
var inherits = require('util').inherits;
var util = require('../util');

/**
 * Construct a {@link CppTemplate}.
 * @class
 * @classdesc {@link CppTemplate} is used to render C++ templates.
 * @extends Template
 * @param {object} [options]
 * @property {string} namespace
 * @property {object} node
 * @property {string} src
 */
function CppTemplate(options) {
  if (!(this instanceof CppTemplate)) {
    return new CppTemplate(options);
  }
  options = Object.assign({
    src: 'src'
  }, options);
  Template.call(this, options);
  Object.defineProperties(this, {
    namespace: {
      enumerable: true,
      value: options.namespace
    },
    node: {
      enumerable: true,
      value: options.node
    },
    src: {
      enumerable: true,
      value: options.src
    }
  });
}

inherits(CppTemplate, Template);

/**
 * Return the default value for a WebIDL dictionary member.
 * @param {object} member
 * @returns {string}
 */
CppTemplate.prototype.argumentDefault = function argumentDefault(member) {
  if (member.default.type === 'number') {
    return member.default.value;
  } else if (member.default.type === 'boolean') {
    return this.toLiteral('bool', member.default.value);
  } else if (member.default.type === 'string') {
    if (this.isEnum(member.idlType.idlType)) {
      return this.toLiteral(member.idlType.idlType, member.default.value);
    } else {
      return this.toStringLiteral(member.default.value);
    }
  }
  return this.toLiteral(member.default.type, member.default.value);
};

/**
 * Return the argument name for a WebIDL dictionary member.
 * @param {object}
 * @returns {string}
 */
CppTemplate.prototype.argumentName = function argumentName(member) {
  return this.publicMemberName(member);
};

/**
 * Return the argument type for a WebIDL dictionary member, taking into
 * consideration whether or not the argument is required, nullable, etc.
 * @param {object} member
 * @returns {string}
 */
CppTemplate.prototype.argumentType = function argumentType(member) {
  var ret = '';
  if (!member.required && !member.idlType.nullable && !member.idlType.sequence) {
    ret += 'Nan::Maybe<';
  }
  ret += this.type(member.idlType);
  if (!member.required && !member.idlType.nullable && !member.idlType.sequence) {
    ret += '>';
  }
  return ret;
};

/**
 * Return a class name for a WebIDL definition.
 * @param {object} node
 * @returns {string}
 */
CppTemplate.prototype.className = function className(node) {
  return node.name;
};

/**
 * Return an enum name for a WebIDL definition.
 * @param {object} node
 * @returns {string}
 */
CppTemplate.prototype.enumName = function enumName(node) {
  return node.name;
};

/**
 * Return a function which parses a V8 value to a WebIDL dictionary member's
 * argument type.
 * @param {object} member
 * @returns {string}
 */
CppTemplate.prototype.fromV8 = function fromV8(member) {
  return 'huh';
};

/**
 * Return the controlling macro to define in the header file for a WebIDL
 * definition.
 * @param {object} node
 * @returns {string}
 */
CppTemplate.prototype.headerDefine = function headerDefine(node) {
  return (this.src ? this.src.toUpperCase() + '_' : '') + node.name.toUpperCase() + '_H_';
};

/**
 * Return the header name for a WebIDL definition.
 * @param {object} node
 * @returns {string}
 */
CppTemplate.prototype.headerName = function headerName(node) {
  return node.name.toLowerCase() + '.h';
};

/**
 * Convert the argument value for a WebIDL dictionary member to its private
 * member type, taking into consideration whether or not the argument has a
 * default value.
 * @param {object} member
 * @returns {string}
 */
CppTemplate.prototype.initialize = function initialize(member) {
  var ret = this.argumentName(member);
  if (member.default && !member.idlType.nullable) {
    ret += '.FromMaybe(' + this.argumentDefault(member) + ')';
  }
  return ret;
};

/**
 * Return the private member name for a WebIDL dictionary member.
 * @param {object} member
 * @returns {string}
 */
CppTemplate.prototype.privateMemberName = function privateMemberType(member) {
  return '_' + this.publicMemberName(member);
};

/**
 * Return the private member type for a WebIDL dictionary member, taking into
 * consideration whether or not the argument is required, has a default, etc.
 * @param {object} member
 * @returns {string}
 */
CppTemplate.prototype.privateMemberType = function privateMemberType(member) {
  if (member.default) {
    return this.type(member.idlType);
  }
  return this.argumentType(member);
};

/**
 * Return the public member name for a WebIDL dictionary member.
 * @param {object} member
 * @returns {string}
 */
CppTemplate.prototype.publicMemberName = function publicMemberName(member) {
  return member.name;
};

/**
 * Return the public member type for a WebIDL dictionary member.
 * @param {object} member
 * @returns {string}
 */
CppTemplate.prototype.publicMemberType = function publicMemberType(member) {
  return this.privateMemberType(member);
};

CppTemplate.prototype.toEnum = function toEnum(type, value) {
  return this.namespace + '::' + this.toEnumName(type, value);
};

/**
 * Return the enum name for a WebIDL enum value.
 * @param {string} type
 * @param {string} value
 * @returns {string}
 */
CppTemplate.prototype.toEnumName = function toEnumName(type, value) {
  return 'k' + util.capitalize(
    value.replace(/ +/g, ' ')
         .replace(/-+/g, ' ')
         .replace(/_+/g, ' ')
         .split(' ')
         .map(util.capitalize)
         .join(''));
};

CppTemplate.prototype.toLiteral = function toLiteral(type, value) {
  try {
    return Template.prototype.toLiteral.call(this, type, value);
  } catch (error) {
    switch (type) {
      case 'bool':
        return this.toBoolean(value);
      case 'std::string':
        return this.toStringLiteral(value);
      case 'double':
      case 'float':
      case 'int8_t':
      case 'uint8_t':
      case 'unsigned long long':
        return value;
    }
    throw error;
  }
};

CppTemplate.prototype.toStringLiteral = function toStringLiteral(value) {
  // TODO(mroberts): We should really escape.
  return '"' + value + '"';
};

/**
 * Return a function which converts a public member value for a WebIDL
 * dictionary member to a V8 value.
 * @param {object} member
 * @returns {string}
 */
CppTemplate.prototype.toV8 = function toV8(member) {
  return 'what';
};

/**
 * Return the C++ type for a WebIDL type.
 * @param {object} idlType
 * @returns {string}
 */
CppTemplate.prototype.type = function type(idlType) {
  // TODO(mroberts): Need union support.
  var ret = '';
  if (idlType.nullable) {
    ret += 'Nan::Maybe<';
  }
  if (idlType.sequence || idlType.generic === 'Array') {
    ret += 'std::vect<';
  }
  ret += idlType.idlType ? type(idlType.idlType) : idlType;
  if (idlType.sequence || idlType.generic === 'Array') {
    ret += '>';
  }
  if (idlType.nullable) {
    ret += '>';
  }
  return ret;
};

module.exports = CppTemplate;
