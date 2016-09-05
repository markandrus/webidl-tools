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
 * @property {string} path
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
    path: {
      enumerable: true,
      value: options.path
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
    ret += 'Optional<';
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
 * Return the controlling macro to define in the header file for a WebIDL
 * definition.
 * @param {object|string} node
 * @returns {string}
 */
CppTemplate.prototype.headerDefine = function headerDefine(node) {
  return (this.path ? this.path.toUpperCase().replace('/', '_') + '_' : '') + (node.name || node).toUpperCase() + '_H_';
};

/**
 * Return the header name for a WebIDL definition.
 * @param {object} node
 * @returns {string}
 */
CppTemplate.prototype.headerName = function headerName(node) {
  return (this.path ? this.path + '/' : '') + node.name.toLowerCase() + '.h';
};

/**
 * Return the headers necessary for inclusion.
 * @param {object} node
 * @returns {string}
 */
CppTemplate.prototype.headers = function headers(node) {
  return [
    '#include "' + (this.path ? this.path + '/' : '') + 'convert.h"'
  ].concat((node.members || []).reduce((headers, member) => {
    if (!member.idlType) {
      return headers;
    }
    return headers.concat(
      getTypeNames(member.idlType).reduce((headers, typeName) => {
        var needsHeader = !{
          DOMHighResTimeStamp: true,
          DOMString: true,
          DOMTimeStamp: true,
          boolean: true,
          byte: true,
          FrozenArray: true,
          octet: true,
          sequence: true,
          string: true,
          USVString: true,
          'unsigned short': true
        }[typeName];
        return !needsHeader ? headers : headers.concat([
          '#include "' + (this.path ? this.path + '/' : '') + typeName.toLowerCase() + '.h"'
        ]);
      }, [])
    );
  }, [])).sort().join('\n');
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
    ret += '.value_or(' + this.argumentDefault(member) + ')';
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
 * Return the C++ type for a WebIDL type.
 * @param {object} idlType
 * @returns {string}
 */
CppTemplate.prototype.type = function type(idlType) {
  // TODO(mroberts): Need union support.
  var ret = '';
  if (Array.isArray(idlType)) {
  }
  if (idlType.nullable) {
    ret += 'Optional<';
  }
  if (idlType.sequence || idlType.generic === 'Array') {
    ret += 'std::vector<';
  }
  if (Array.isArray(idlType)) {
    if (idlType.length !== 2) {
      throw new Error('No support for unions of more than two types');
    }
    ret += 'Either<' + this.type(idlType[0]) + ', ' + this.type(idlType[1]) + '>';
  } else {
    ret += idlType.idlType ? this.type(idlType.idlType) : idlTypeToCppType(idlType);
  }
  if (idlType.sequence || idlType.generic === 'Array') {
    ret += '>';
  }
  if (idlType.nullable) {
    ret += '>';
  }
  return ret;
};

/**
 * Return "using" statements.
 * @param {object} node
 * @returns {string}
 */
CppTemplate.prototype.usings = function usings(node) {
  return [
    'using ' + this.namespace + '::Convert;',
    'using ' + this.namespace + '::Either;',
    'using ' + this.namespace + '::' + this.className(node) + ';'
  ].concat((node.members || []).reduce((usings, member) => {
    if (!member.idlType) {
      return usings;
    }
    return usings.concat(
      getTypeNames(member.idlType).reduce((usings, typeName) => {
        var needsUsing = !{
          DOMHighResTimeStamp: true,
          DOMString: true,
          DOMTimeStamp: true,
          boolean: true,
          byte: true,
          FrozenArray: true,
          octet: true,
          sequence: true,
          string: true,
          USVString: true,
          'unsigned short': true
        }[typeName];
        return !needsUsing ? usings : usings.concat([
          'using ' + this.namespace + '::' + typeName + ';'
        ]);
      }, [])
    );
  }, [])).sort().join('\n');
};

function getTypeNames(idlType) {
  if (Array.isArray(idlType)) {
    return idlType.reduce((typeNames, idlType) => {
      return typeNames.concat(getTypeNames(idlType));
    }, []);
  } else if (typeof idlType === 'string') {
    return [idlType];
  }
  return getTypeNames(idlType.idlType);
}

function idlTypeToCppType(type) {
  return {
    DOMHighResTimeStamp: 'double',
    DOMString: 'std::string',
    DOMTimeStamp: 'unsigned long long',
    boolean: 'bool',
    byte: 'int8_t',
    FrozenArray: 'std::vect',
    octet: 'uint8_t',
    sequence: 'std::vect',
    string: 'std::string',
    USVString: 'std::string'
  }[type] || type;
}

module.exports = CppTemplate;
