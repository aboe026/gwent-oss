import type { Configuration } from 'webpack'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import path from 'path'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import WebpackShellPluginNext from 'webpack-shell-plugin-next'

import { NODE_ENV } from '@gwent/env'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default (env: any, argv: any) => {
  const isProduction = argv.mode === NODE_ENV.Prod
  const config: Configuration = {
    stats: 'errors-only',
    mode: isProduction ? 'production' : 'development',
    entry: './src/index.tsx',
    output: {
      path: path.join(import.meta.dirname, 'build'),
    },
    module: {
      rules: [
        {
          test: /\.(mts|tsx)$/,
          exclude: /node_modules/,
          resolve: {
            extensions: ['.mts', '.tsx', '.js', '.json'],
            // https://github.com/webpack/webpack/issues/13252
            extensionAlias: {
              '.jsx': '.tsx',
              '.mjs': '.mts',
            },
          },
          use: {
            loader: 'ts-loader',
            options: {
              projectReferences: true,
              compilerOptions: {
                jsx: isProduction ? 'react-jsx' : 'react-jsxdev',
              },
            },
          },
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
      ],
    },
    devtool: isProduction ? undefined : 'source-map',
    plugins: [
      new HtmlWebpackPlugin({
        template: 'src/index.html',
      }),
      new MiniCssExtractPlugin(),
      new CopyWebpackPlugin({
        patterns: [{ from: 'libs/env/build/src' }],
      }),
      new WebpackShellPluginNext({
        logging: false,
        onBuildEnd: {
          scripts: ['yarn g:rimraf build/src'],
          blocking: false,
          parallel: true,
        },
        onDoneWatch: {
          scripts: ['yarn g:rimraf build/src'],
          blocking: false,
          parallel: true,
        },
      }),
    ],
  }
  return config
}
