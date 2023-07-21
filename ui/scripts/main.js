requirejs.config({
  baseUrl: "/scripts",
  paths: {
    frame: "frame",
    tauri: "tauri",
    vue: "vue.global",
  },
  shim: {
    vue: {
      exports: "Vue",
    },
  },
});

requirejs(
  ["frame"],
  (votes) => {},
  (error) => console.log(error.message),
);
