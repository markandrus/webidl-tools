'use strict';

var Template = require('../template');
var inherits = require('util').inherits;
var path = require('path');

/**
 * Construct a {@link JavaScriptTemplate}.
 * @class
 * @classdesc {@link JavaScriptTemplate} is used to render JavaScript templates.
 * @extends Template
 * @param {object} [options]
 * @property {?*} idlType
 * @property {Array<*>} idlTypes
 * @property {?object} member
 * @property {?object} node
 * @property {Array<object>} nodes
 */
function JavaScriptTemplate(options) {
  if (!(this instanceof JavaScriptTemplate)) {
    return new JavaScriptTemplate(options);
  }
  options = Object.assign({
    idlType: null,
    idlTypes: [],
    member: null,
    node: null,
    nodes: [],
    template: path.join(__dirname, 'templates/index.ejs')
  }, options);
  Template.call(this, options);
  Object.defineProperties(this, {
    idlType: {
      enumerable: true,
      value: options.idlType
    },
    idlTypes: {
      enumerable: true,
      value: options.idlTypes
    },
    member: {
      enumerable: true,
      value: options.member
    },
    node: {
      enumerable: true,
      value: options.node
    },
    nodes: {
      enumerable: true,
      value: options.nodes
    }
  });
}

inherits(JavaScriptTemplate, Template);

module.exports = JavaScriptTemplate;
