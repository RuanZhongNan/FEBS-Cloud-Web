'use strict'
const settings = require('./src/settings.js')
const path = require('path')

function resolve(dir) {
  return path.join(__dirname, dir)
}

const name = settings.title // page title
// If your port is set to 80,
// use administrator privileges to execute the command line.
// For example, Mac: sudo npm run
// TODO 这里暂时更改成 后端的端口号 8301 。 9527 -> 8301
const port = 9527; // dev port

// All configuration item explanations can be find in https://cli.vuejs.org/config/
module.exports = {
  /**
   * You will need to set publicPath if you plan to deploy your site under a sub path,
   * for example GitHub Pages. If you plan to deploy your site to https://foo.github.io/bar/,
   * then publicPath should be set to "/bar/".
   * In most cases please use '/' !!!
   * Detail: https://cli.vuejs.org/config/#publicpath
   */
  publicPath: '/',
  outputDir: 'dist',
  assetsDir: 'static',
  lintOnSave: process.env.NODE_ENV === 'development',
  productionSourceMap: false,
  devServer: {
    port: port,
    open: false,
    overlay: {
      warnings: false,
      errors: true
    },
    proxy: {
      // change xxx-api/login => mock/login
      // detail: https://cli.vuejs.org/config/#devserver-proxy

      [process.env.VUE_APP_BASE_API]: {
        // target: 'http://localhost:8301/',
        // http://192.168.8.189:9527/
        // http://192.168.8.189:8301/

        target: 'http://localhost:8301/',
        changeOrigin: true,
        pathRewrite: {
          ['^' + process.env.VUE_APP_BASE_API]: ''
        }
      },

      // TODO: 开启以下的注释内容。实现跨域浏览。
      // "/auth/user": {
      //   target: "http://localhost:8301/",
      //   changeOrigin: true,
      //   pathRewrite: {
      //     "^/auth/user": '',
      //   },
      // },

      // 可能的目标： 192.168.8.108
      // TODO: 现在token验证传递失败，试图设置这一部分的反向代理。
      // "/auth/oauth/token": {
      //   target: "http://localhost:8301/",
      //   changeOrigin: true,
      //   pathRewrite: {
      //     "^/auth/oauth/token": '',
      //   },
      // },

      // 看看手动设置的跨域浏览 是否起效？不起效。
      // "auth/captcha": {
      //   target: "http://localhost:8301/",
      //   changeOrigin: true,
      //   pathRewrite: {
      //     "^/auth/captcha": '',
      //   },
      // },







    }
  },
  configureWebpack: {
    // provide the app's title in webpack's name field, so that
    // it can be accessed in index.html to inject the correct title.
    name: name,
    resolve: {
      alias: {
        '@': resolve('src')
      }
    }
  },
  chainWebpack(config) {
    config.plugins.delete('preload') // TODO: need test
    config.plugins.delete('prefetch') // TODO: need test

    // set svg-sprite-loader
    config.module
      .rule('svg')
      .exclude.add(resolve('src/icons'))
      .end()
    config.module
      .rule('icons')
      .test(/\.svg$/)
      .include.add(resolve('src/icons'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]'
      })
      .end()

    // set preserveWhitespace
    config.module
      .rule('vue')
      .use('vue-loader')
      .loader('vue-loader')
      .tap(options => {
        options.compilerOptions.preserveWhitespace = true
        return options
      })
      .end()

    config
      // https://webpack.js.org/configuration/devtool/#development
      .when(process.env.NODE_ENV === 'development',
        config => config.devtool('cheap-source-map')
      )

    config
      .when(process.env.NODE_ENV !== 'development',
        config => {
          config
            .plugin('ScriptExtHtmlWebpackPlugin')
            .after('html')
            .use('script-ext-html-webpack-plugin', [{
              // `runtime` must same as runtimeChunk name. default is `runtime`
              inline: /runtime\..*\.js$/
            }])
            .end()
          config
            .optimization.splitChunks({
              chunks: 'all',
              cacheGroups: {
                libs: {
                  name: 'chunk-libs',
                  test: /[\\/]node_modules[\\/]/,
                  priority: 10,
                  chunks: 'initial' // only package third parties that are initially dependent
                },
                elementUI: {
                  name: 'chunk-elementUI', // split elementUI into a single package
                  priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
                  test: /[\\/]node_modules[\\/]_?element-ui(.*)/ // in order to adapt to cnpm
                },
                commons: {
                  name: 'chunk-commons',
                  test: resolve('src/components'), // can customize your rules
                  minChunks: 3, //  minimum common number
                  priority: 5,
                  reuseExistingChunk: true
                }
              }
            })
          config.optimization.runtimeChunk('single')
        }
      )
  }
}
