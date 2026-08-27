import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'

export default {
    input: 'app.js',
    output: {
        file: 'dist/app.mjs',
        format: 'esm',
        sourcemap: false,
    },
    // node 内置模块保持 external，由运行时提供
    plugins: [
        nodeResolve({ preferBuiltins: true }),
        commonjs(),
        json(),
    ],
}
