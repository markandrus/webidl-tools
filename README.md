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
                           definitions.
    js                     Generate JavaScript code from WebIDL definitions.
    help <sub-command>     Show the --help for a specific command

```

### extract

```
$ webidl-tools extract --help

  Usage: webidl-tools-extract [options] <html ...>

  Extract WebIDL definitions from HTML documents (for example, W3C
  specifications). This command also accepts URLs.

  Options:

    -h, --help       output usage information
    -V, --version    output the version number
    -o, --out <dir>  Directory to write the WebIDL to (defaults to ./idl)

```

### flow

```
$ webidl-tools flow --help

  Usage: webidl-tools-flow [options] <idl ...>

  Generate Flow type declarations from WebIDL definitions.

  Options:

    -h, --help               output usage information
    -V, --version            output the version number
    --match <regex>          Match WebIDL definition names
    --replace <replacement>  Replace any WebIDL definition names matched with
                             --match
    --only <names>           Only process WebIDL definitions with the given
                             names
    --skip <names>           Skip WebIDL definitions with the given names
    -o, --out <dir>          Directory to write Flow type declarations to
                             (defaults to ./decls)

```

### js

```
$ webidl-tools js --help

  Usage: webidl-tools-js [options] <idl ...>

  Generate JavaScript code from WebIDL definitions.

  Options:

    -h, --help                   output usage information
    -V, --version                output the version number
    --match <regex>              Match WebIDL definition names
    --replace <replacement>      Replace any WebIDL definition names matched
                                 with --match
    --only <names>               Only process WebIDL definitions with the
                                 given names
    --skip <names>               Skip WebIDL definitions with the given names
    --validators                 Generate validators for enums, dictionaries,
                                 etc. (default)
    --no-validators              Do not generate validators
    --classes                    Generate classes, e.g., for interfaces with
                                 constructors (default)
    --no-classes                 Do not generate classes
    --flow-types-in-comments     Include Flow types in comments (default)
    --no-flow-types-in-comments  Do not include Flow types in comments
    --jsdoc                      Include JSDoc comments (default)
    --no-jsdoc                   Do not include JSDoc comments
    -o, --out <file>             File to write JavaScript code to (defaults
                                 to ./definitions.js)

```
