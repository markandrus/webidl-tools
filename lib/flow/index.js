'use strict';

var h = require('highland');
var log = require('../util').log;
var Transform = require('../transform');

module.exports = Transform.create(__dirname, {
  transform: function transform(definitions) {
    log.debug('Generting Flow type declarations');
    return h(definitions.map(definition => this.transformOne(definition)));
  },

  transformOne: function transformOne(definition) {
    log.debug('Generting Flow type declaration for %s', definition.name);
    return [
      definition.name.toLowerCase() + '.js',
      new this.Template({ node: definition }).toString()
    ];
  }
});
