const path = require("path");
const fs = require("fs");
const webpack = require("webpack");

// Плагины
const SpriteLoaderPlugin = require("svg-sprite-loader/plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const devip = require("dev-ip");
const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
// Пути
const PATHS = {
  src: path.resolve(__dirname, "src"),
  dist: path.resolve(__dirname, "dist"),
  assets: "assets/",
};

// Проверка существования директорий
const checkDir = (dir) => {
  if (!fs.existsSync(dir)) {
    console.warn(`Directory not found: ${dir}`);
    return [];
  }
  return fs.readdirSync(dir).filter((fileName) => fileName.endsWith(".pug"));
};

const PAGES_DIR = path.resolve(PATHS.src, "pages");
const MODALS_DIR = path.resolve(PATHS.src, "modals");
const PAGES = checkDir(PAGES_DIR);
const MODALS = checkDir(MODALS_DIR);

// Паттерны для копирования
const copyPatterns = [];
const imgPath = path.resolve(PATHS.src, PATHS.assets, "img");
const staticPath = path.resolve(PATHS.src, "static");

if (fs.existsSync(imgPath)) {
  copyPatterns.push({
    from: imgPath,
    to: path.resolve(PATHS.dist, PATHS.assets, "img"),
    noErrorOnMissing: true,
  });
}

if (fs.existsSync(staticPath)) {
  copyPatterns.push({
    from: staticPath,
    to: PATHS.dist,
    noErrorOnMissing: true,
  });
}

module.exports = {
  entry: {
    main: path.resolve(`${PATHS.src}`, "index.js"),
  },
  output: {
    filename: `${PATHS.assets}js/[name].js`,
    path: PATHS.dist,
    publicPath: "/",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: "babel-loader",
        exclude: "/node_modules/",
      },
      {
        test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
        type: "asset/resource",
        generator: {
          filename: "assets/fonts/[name][ext]",
        },
      },
      {
        test: /\.(png|jpg|gif)$/,
        type: "asset/resource",
        generator: {
          filename: "assets/img/[name][ext]",
        },
      },
      {
        test: /\.(scss|css)$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [["autoprefixer"]],
              },
            },
          },
          "sass-loader",
        ],
      },
      // {
      //   test: /\.css$/,
      //   use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"],
      // },
      {
        test: /\.pug$/,
        use: [
          {
            loader: "@webdiscus/pug-loader",
            options: {
              pretty: true,
              basedir: PATHS.src,
              data: {
                PATHS: PATHS,
              },
            },
          },
        ],
      },
      {
        test: /\.svg$/,
        include: path.resolve(PATHS.src, "assets", "sprite"), // Путь к вашим SVG иконкам
        use: [
          {
            loader: "svg-sprite-loader",
            options: {
              extract: true,
              spriteFilename: "sprite.svg",
              publicPath: `${PATHS.assets}img/`,
            },
          },
          "svgo-loader",
        ],
      },
      {
        test: /\.svg$/,
        exclude: path.resolve(PATHS.src, "assets/sprite"), // Исключаем иконки для спрайта
        type: "asset/resource",
        generator: {
          filename: "assets/img/[name][ext]",
        },
      },
    ],
  },
  plugins: [
    new SpriteLoaderPlugin({
      plainSprite: true,
    }),
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: `${PATHS.assets}css/[name].css`,
    }),
    new CopyWebpackPlugin({ patterns: copyPatterns }),
    ...PAGES.map(
      (page) =>
        new HtmlWebpackPlugin({
          template: path.resolve(PAGES_DIR, page),
          filename: `./${page.replace(/\.pug/, ".html")}`,
          inject: "body",
        })
    ),
    ...MODALS.map(
      (modal) =>
        new HtmlWebpackPlugin({
          inject: false,
          template: path.resolve(MODALS_DIR, modal),
          filename: `./modals/${modal.replace(/\.pug/, ".html")}`,
        })
    ),
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: {
            comments: false,
          },
        },
        extractComments: false,
      }),
      new CssMinimizerPlugin(),
    ],
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
          priority: 10,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": PATHS.src,
    },
  },
  devServer: {
    host: "localhost",
    port: 3000,
    client: {
      overlay: {
        warnings: true,
        errors: true,
      },
    },
    static: {
      watch: true,
    },
    liveReload: true,
    hot: false,
    open: true,
  },
};
