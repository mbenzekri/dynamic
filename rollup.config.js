/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import filesize from 'rollup-plugin-filesize';
//import {terser} from 'rollup-plugin-terser';
import resolve from 'rollup-plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json';
import commonjs from  '@rollup/plugin-commonjs';
import url from '@rollup/plugin-url'

export default {
  input: './build/dynamic.js',
  output: {
    file: './build/index.js',
    format: 'es',
  },
  onwarn(warning) {
    if (warning.code !== 'THIS_IS_UNDEFINED') {
      console.error(`(!) ${warning.message}`);
    }
  },
  plugins: [
    commonjs(),
    json(),
    replace({
      "preventAssignment" : true,
      'Reflect.decorate': 'undefined'
    }),
    resolve({
        browser: true,
        preferBuiltins: false,
    }),
    // terser({
    //   module: true,
    //   warnings: true,
    //   mangle: {
    //     properties: {
    //       regex: /^__/,
    //     },
    //   },
    // }),
    filesize({
      showBrotliSize: true,
    }),
    url({
        // by default, rollup-plugin-url will not handle font files
        include: ['**/*.woff', '**/*.woff2'],
        // setting infinite limit will ensure that the files 
        // are always bundled with the code, not copied to /dist
        limit: Infinity,
      }),
  ],
};
