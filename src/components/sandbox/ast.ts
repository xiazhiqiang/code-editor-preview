/**
 * ast 调试：https://astexplorer.net/
 */

import * as acorn from "acorn";
import jsx from "acorn-jsx";
import * as walk from "acorn-walk";
// @ts-ignore
import * as jsxWalk from "acorn-jsx-walk";

// Extend Acorn parser with JSX
const parser = acorn.Parser.extend(jsx());

// Extend Acorn walk with JSX
jsxWalk.extend(walk.base);

export { walk, parser };
