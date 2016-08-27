'use strict';

var Context = require('./context');
var inherits = require('util').inherits;
var path = require('path');

/**
 * Construct a {@link JsContext}.
 * @class
 * @classdesc {@link JsContext} is used to render JavaScript templates.
 * @extends Context
 * @param {object} [options]
 * @property {?*} idlType
 * @property {Array<*>} idlTypes
 * @property {?object} member
 * @property {?object} node
 * @property {Array<object>} nodes
 */
function JsContext(options) {
  if (!(this instanceof JsContext)) {
    return new JsContext(options);
  }
  options = Object.assign({
    idlType: null,
    idlTypes: [],
    member: null,
    node: null,
    nodes: [],
    template: path.join(__dirname, '../templates/js.ejs')
  }, options);
  Context.call(this, options);
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

inherits(JsContext, Context);

module.exports = JsContext;
