'use strict';

var Template = require('../template');
var inherits = require('util').inherits;
var path = require('path');

function FlowTemplate(options) {
  if (!(this instanceof FlowTemplate)) {
    return new FlowTemplate(options);
  }
  options = Object.assign({
    arguments: [],
    idlType: null,
    member: null,
    node: null,
    template: path.join(__dirname, 'templates/index.ejs')
  }, options);
  Template.call(this, options);
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

inherits(FlowTemplate, Template);

module.exports = FlowTemplate;
