'use strict';

var h = require('highland');
var log = require('../util').log;
var path = require('path');
var Transform = require('../transform');

module.exports = Transform.create(__dirname, {
  transform: function transform(definitions) {
    return h([
      h(definitions.map(definition => this.transformH(definitions, definition))),
      h(definitions.map(definition => this.transformCC(definitions, definition)))
    ]).sequence();
  },

  transformH: function transformH(definitions, definition) {
    return [
      definition.name.toLowerCase() + '.h',
      new this.Template({
        definitions: definitions,
        node: definition,
        template: path.join(__dirname, 'templates/index.h.ejs')
      }).toString()
    ];
  },

  transformCC: function transformCC(definitions, definition) {
    return [
      definition.name.toLowerCase() + '.cc',
      new this.Template({
        definitions: definitions,
        node: definition,
        template: path.join(__dirname, 'templates/index.cc.ejs')
      }).toString()
    ];
  }
});
