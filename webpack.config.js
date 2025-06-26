import path from "path";
import fs from "fs";
import webpack from "webpack";
// import SpriteLoaderPlugin from "svg-sprite-loader/plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PATHS = {
  src: path.resolve(__dirname, "src"),
  dist: path.resolve(__dirname, "dist"),
  assets: "assets/",
};

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

export default {
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
        test: /\.pug$/,
        use: [
          {
            loader: "@webdiscus/pug-loader",
            options: {
              pretty: true,
              basedir: PATHS.src,
              data: {
                PATHS: PATHS,
                cssPath: `${PATHS.assets}css/main.css`,
              },
            },
          },
        ],
      },
      {
        test: /\.svg$/,
        include: path.resolve(PATHS.src, "assets", "sprite"),
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
        exclude: path.resolve(PATHS.src, "assets/sprite"),
        type: "asset/resource",
        generator: {
          filename: "assets/img/[name][ext]",
        },
      },
    ],
  },
  plugins: [
    // new SpriteLoaderPlugin({
    //   plainSprite: true,
    // }),
    ...(process.env.NODE_ENV === "production"
      ? [new CleanWebpackPlugin()]
      : []),
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
      directory: path.join(__dirname, "dist"),
    },
    liveReload: true,
    hot: false,
    open: true,
  },
};
