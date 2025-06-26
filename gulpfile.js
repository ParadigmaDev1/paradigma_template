import browserSync from "browser-sync";
import gulp from "gulp";
import gulpSass from "gulp-sass";
import dartSass from "sass";
import postcss from "gulp-postcss";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";
import rename from "gulp-rename";
import newer from "gulp-newer";
import webp from "gulp-webp";
import imagemin from "gulp-imagemin";

const sass = gulpSass(dartSass);
const { create } = browserSync;

function images() {
  // Первый поток: конвертация в WebP
  return (
    gulp
      .src("./src/assets/img/**/*.{jpg,jpeg,png,gif}")
      .pipe(
        newer({
          dest: "./dist/assets/img/",
          ext: ".webp", // Проверяем существование .webp файлов
        })
      )
      .pipe(webp())
      .on("error", (err) => {
        console.error("WebP error:", err.message);
        this.emit("end");
      })
      .pipe(gulp.dest("./dist/assets/img/"))

      // Второй поток: оптимизация исходников (опционально)
      .pipe(gulp.src("./src/assets/img/**/*.{jpg,jpeg,png,gif}"))
      .pipe(newer("./dist/assets/img/original/")) // Отдельная папка!
      .pipe(
        imagemin({
          progressive: true,
          svgoPlugins: [{ removeViewBox: false }],
          interlaced: true,
          optimizationLevel: 1,
        })
      )
      .pipe(browserSync.stream())
  );
}

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
        path.dirname = "";
      })
    )
    .pipe(gulp.dest("./dist/assets/css"))
    .pipe(browserSync.stream());
}

function watchStyles() {
  gulp.watch("./src/**/*.scss", styles);
}

function serve() {
  const bs = create();
  bs.init({
    proxy: "http://localhost:3000",
    port: 3001,
    open: false,
  });

  gulp.watch("./src/**/*.scss", styles);
}

export const dev = gulp.series(styles, serve, images);
export const build = gulp.series(styles, images);
