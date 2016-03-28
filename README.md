webidl-tools
============

webidl-tools provides a suite of commands for extracting and transforming
WebIDL.

* Extract WebIDL definitions from HTML documents (for example, W3C
  specifications).
* Generate Flow type declarations from WebIDL definitions.
* Generate JavaScript code from WebIDL definitions.

Install
-------

```
npm install -g webidl-tools
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
    --rename <s/foo/bar/>  Rename WebIDL interface, argument, etc., names (can
                         be specified multiple times; applied after --skip)
    --only </foo/>         Only process WebIDL definitions with the given name
                         (can be specified multiple times)
    --skip </foo/>         Skip WebIDL definitions with the given name (can be
                         specified multiple times; applied after --only)
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
    --rename <s/foo/bar/>  Rename WebIDL interface, argument, etc., names (can
                         be specified multiple times; applied after --skip)
    --only </foo/>         Only process WebIDL definitions with the given name
                         (can be specified multiple times)
    --skip </foo/>         Skip WebIDL definitions with the given name (can be
                         specified multiple times; applied after --only)
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
                                 to ./definitions.js)

```
