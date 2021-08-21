# Tree Term Rewriting
This is a work in progress library written in TypeScript for term rewriting using trees. The library is still a work in progress, things need to be more organized, more tests need to be written and so on.

# Features
## Term Rewriting on Trees
The functions `applyRules()` and `rewrite()` can be used to rewrite a tree given a rewrite rule containing a pattern and a replacement.

Example (the expressions would be represented as trees in the library):
- Input: `a + b + -b`
- Rewrite rule from: `$x + -$x`
- Rewrite rule to: `0`
- Output: `a + 0`

## Expression parsing
The library provides a function to parse expressions into trees. The grammar is contained in the `grammars` folder.

There are two representations for trees. The first one is the obvious one with nodes (type `TreeNode`) where each node stores its own value, a unique index as well as a list of child nodes.
The second one stores the tree using an [Euler Tour](https://en.wikipedia.org/wiki/Euler_tour_technique). This representation makes tree matching and substitution easier. There are functions to convert between the two representations (`makeEulerTree()`, `treeFromEulerTree()`).

## Knuth-Bendix Completion
[Knuth-Bendix completion](https://en.wikipedia.org/wiki/Knuth%E2%80%93Bendix_completion_algorithm) finds a confluent term rewriting system given a couple of basic rewrite rules and an ordering on functions.
Basically it will find more rewrite rules such that applying the rules to equal but different terms will eventually result in the same term (eg. `a + b - b` and `a * 3 / 3` are the same, and eventually would simplify to `a`).

## Visualization / DOT
There are functions to convert trees to the [DOT](https://en.wikipedia.org/wiki/DOT_(graph_description_language)) format which can be visualized by many different softwares. There are also functions to directly convert them to urls
that visualize them with using https://dreampuf.github.io/GraphvizOnline.

# Building
The library can be built by running `yarn run build` which will create the `dist` folder containing the javascript code, the definitions and the source map.

# Run tests
- Run all tests (unit tests and integration tests): `yarn run test`
- Run only specific tests: `yarn run test -g <string|regexp>` (eg. to run integration tests `yarn run test -g integration`)

# Examples
The examples can be run by first building the library and then running them in the dist folder (eg. `node dist/examples/ga.js`).

- [Geometric Algebra simplification](examples/ga.ts): Specifies basic rules for a [Geometric Algebra](https://en.wikipedia.org/wiki/Geometric_algebra) rewrite system and simplifies a term

# References
These are references that I found useful for learning about tree rewriting and Knuth-Bendix completion
- [A Taste of Rewrite Systems (PDF warning)](https://www.cs.tau.ac.il/~nachum/papers/taste-fixed.pdf): Overview of term rewriting and Knuth-Bendix completion
- [Completion Without Failure](http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.32.979): Describes the unfailure extension to Knuth-Bendix completion necessary for many practically interesting systems
- [Things to know when implementing LPO](https://www.worldscientific.com/doi/10.1142/S0218213006002564): Optimization for the Lexicographic Path Ordering (LPO) which is a useful ordering for Knuth-Bendix completion
- [Dr. Krysia Broda's lecture notes](http://wp.doc.ic.ac.uk/kb/teaching/): Some nice related slides which have summaries and some examples too
- [An Introduction to Knuth-Bendix Completion](https://www.researchgate.net/publication/220460160_An_Introduction_to_Knuth-Bendix_Completion): Short introduction to Knuth-Bendix completion
- [Jin Xing Lim's YouTube playlist about Knuth-Bendix completion](https://www.youtube.com/watch?v=cB5lvUK3wLU&list=PL0u-TZkut9qKOUXUPk0pIBI6-py0lrUty): Great introduction videos to Knuth-Bendix completion following the aforementioned introduction
- [Term Rewriting and All That](https://www.cambridge.org/core/books/term-rewriting-and-all-that/71768055278D0DEF4FFC74722DE0D707): Comprehensive and popular book about term rewriting (and all that!)