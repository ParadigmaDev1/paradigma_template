const browserSync = require("browser-sync").create();

const gulp = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const rename = require("gulp-rename");

// Обработка стилей
function styles() {
  const plugins = [
    autoprefixer(),
    ...(process.env.NODE_ENV === "production" ? [cssnano()] : []),
  ];

  return gulp
    .src([
      "./src/pug/**/*.scss",
      "./src/modals/**/*.scss",
      "./src/assets/scss/*.scss",
    ])
    .pipe(sass().on("error", sass.logError))
    .pipe(postcss(plugins))
    .pipe(
      rename((path) => {
        // Убираем путь к папке для всех файлов
        path.dirname = "";
      })
    )
    .pipe(gulp.dest("./dist/assets/css"))
    .pipe(browserSync.stream()); // Инжектим стили без перезагрузки
}
// Слежение за стилями в dev
function watchStyles() {
  gulp.watch("./src/**/*.scss", styles);
}

function serve() {
  browserSync.init({
    proxy: "http://localhost:3000", // Проксируем Webpack Dev Server
    port: 3001,
    open: false,
  });

  gulp.watch("./src/**/*.scss", styles);
}

// Задачи
exports.dev = gulp.series(styles, serve);
exports.build = gulp.series(styles);
