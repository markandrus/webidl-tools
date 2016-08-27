'use strict';

var h = require('highland');
var log = require('../util').log;
var Transform = require('../transform');

module.exports = Transform.create(__dirname, {
  transform: function transform(definitions) {
    return h([
      [
        'validators.js',
        new this.Template({ nodes: definitions }).toString()
      ]
    ]);
  }
});
