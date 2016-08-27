'use strict';

var Context = require('./context');
var inherits = require('util').inherits;
var path = require('path');

function FlowContext(options) {
  if (!(this instanceof FlowContext)) {
    return new FlowContext(options);
  }
  options = Object.assign({
    arguments: [],
    idlType: null,
    member: null,
    node: null,
    template: path.join(__dirname, '../templates/flow.ejs')
  }, options);
  Context.call(this, options);
  Object.defineProperties(this, {
    arguments: {
      enumerable: true,
      value: options.arguments
    },
    idlType: {
      enumerable: true,
      value: options.idlType
    },
    member: {
      enumerable: true,
      value: options.member
    },
    node: {
      enumerable: true,
      value: options.node
    }
  });
}

inherits(FlowContext, Context);

module.exports = FlowContext;
