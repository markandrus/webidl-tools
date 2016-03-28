webidl-tools
============

[![NPM](https://img.shields.io/npm/v/webidl-tools.svg)](https://www.npmjs.com/package/webidl-tools) [![Build Status](https://travis-ci.org/markandrus/webidl-tools.svg?branch=master)](https://travis-ci.org/markandrus/webidl-tools)

_**Note:** This project is a work-in-progress and exists primarily to enable
some pet projects. As such, it is tuned to those use cases. If you need
additional functionality, bug fixes, etc., please open a pull request._

webidl-tools provides a suite of commands for extracting and transforming
[WebIDL](https://www.w3.org/TR/WebIDL/).

* Extract WebIDL definitions from HTML documents (for example, W3C
  specifications).
* Generate Flow type declarations from WebIDL definitions.
* Generate JavaScript code from WebIDL definitions.

Install
-------

```
npm install -g webidl-tools
```

Example
-------

Set your `.flowconfig` to

```
[include]
validators.js

[libs]
decls
```

Then run

```
webidl-tools extract \
  https://w3c.github.io/webrtc-pc/archives/20160215/webrtc.html \
  --rename 'AlgorithmIdentifier|MediaStream|WorkerGlobalScope/Object'
webidl-tools flow
webidl-tools js
flow check
```

The file `validators.js` will contain typechecked validators for enums and
dictionaries defined in the WebIDL. For example,

```
$ node
> var validators = require('./validators');
undefined
> validators.validateRTCIceRole('controlling')
"controlling"
> validators.validateRTCIceRole('foo')
TypeError: Invalid RTCIceRole "foo"
```

Usage
-----

```
$ webidl-tools --help

  Usage: webidl-tools <sub-command> [options]

  webidl-tools provides a suite of commands for extracting and transforming
  WebIDL.

  Commands:

    extract                Extract WebIDL definitions from HTML documents (for
                           example, W3C specifications). This command also
                           accepts URLs.
    flow                   Generate Flow type declarations from WebIDL
                           definitions. If multiple WebIDL definitions with the
                           same name are provided, they will be merged. This
                           command also accepts URLs.
    js                     Generate JavaScript code from WebIDL definitions.
                           The generated code can be used to validate WebIDL
                           enums and dictionaries. If multiple WebIDL
                           definitions with the same name are provided, they
                           will be merged. This command also accepts URLs.
    help <sub-command>     Show the --help for a specific command

```

### extract

```
$ webidl-tools extract --help

  Usage: webidl-tools-extract [options] <html ...>

  Extract WebIDL definitions from HTML documents (for example, W3C
  specifications). This command also accepts URLs.

  Options:

    -h, --help             output usage information
    -V, --version          output the version number
    --rename <s/foo/bar/>  Rename WebIDL interface, argument, etc., names
                           (can be specified multiple times; applied after
                           --skip)
    --only </foo/>         Only process WebIDL definitions with the given
                           name (can be specified multiple times)
    --skip </foo/>         Skip WebIDL definitions with the given name (can
                           be specified multiple times; applied after --only)
    -b, --bail             Exit on WebIDL parse failure
    --merge                Merge WebIDL definitions by unioning interface and
                           dictionary members
    --no-merge             Don't merge WebIDL definitions; if a merge is
                           required and this option is specified, the process
                           exits
    -o, --out <dir>        Directory to write the WebIDL to (defaults to ./idl)

```

### flow

```
$ webidl-tools flow --help

  Usage: webidl-tools-flow [options] <idl ...>

  Generate Flow type declarations from WebIDL definitions. If multiple WebIDL
  definitions with the same name are provided, they will be merged. This
  command also accepts URLs.

  Options:

    -h, --help             output usage information
    -V, --version          output the version number
    --rename <s/foo/bar/>  Rename WebIDL interface, argument, etc., names
                           (can be specified multiple times; applied after
                           --skip)
    --only </foo/>         Only process WebIDL definitions with the given
                           name (can be specified multiple times)
    --skip </foo/>         Skip WebIDL definitions with the given name (can
                           be specified multiple times; applied after --only)
    -b, --bail             Exit on WebIDL parse failure
    --merge                Merge WebIDL definitions by unioning interface and
                           dictionary members (default)
    --no-merge             Don't merge WebIDL definitions; if a merge is
                           required and this option is specified, the process
                           exits
    -o, --out <dir>        Directory to write Flow type declarations to
                           (defualts to ./decls)

```

### js

```
$ webidl-tools js --help

  Usage: webidl-tools-js [options] <idl ...>

  Generate JavaScript code from WebIDL definitions. The generated code can be
  used to validate WebIDL enums and dictionaries. If multiple WebIDL
  definitions with the same name are provided, they will be merged. This
  command also accepts URLs.

  Options:

    -h, --help                   output usage information
    -V, --version                output the version number
    --rename <s/foo/bar/>        Rename WebIDL interface, argument, etc.,
                                 names (can be specified multiple times;
                                 applied after --skip)
    --only </foo/>               Only process WebIDL definitions with the
                                 given name (can be specified multiple times)
    --skip </foo/>               Skip WebIDL definitions with the given name
                                 (can be specified multiple times; applied
                                 after --only)
    -b, --bail                   Exit on WebIDL parse failure
    --merge                      Merge WebIDL definitions by unioning
                                 interface and dictionary members (default)
    --no-merge                   Don't merge WebIDL definitions; if a merge
                                 is required and this option is specified,
                                 the process exits
    --flow-types-in-comments     Include Flow types in comments (default)
    --no-flow-types-in-comments  Do not include Flow types in comments
    --jsdoc                      Include JSDoc comments (default)
    --no-jsdoc                   Do not include JSDoc comments
    -o, --out <file>             File to write JavaScript code to (defaults
                                 to ./validators.js)

```
