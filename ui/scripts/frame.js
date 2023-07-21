define(["tauri", "vue"], function (tauri, vue) {
  vue
    .createApp({
      data() {
        return {
          subtitles: {
            path: "",
            valid: false,
            popup: false,
            message: "Subtitles file not selected.",
          },
          text: {
            path: "",
            valid: false,
            popup: false,
            message: "Text file not selected.",
          },
          output: {
            path: "",
            valid: false,
            popup: false,
            message: "Output file not selected.",
          },
        };
      },

      watch: {
        "subtitles.path": function (path) {
          tauri
            .canRead(path)
            .then((result) => {
              this.subtitles.valid = result;
              this.subtitles.popup = !result;
            })
            .catch((error) => {
              this.subtitles.valid = false;
              this.subtitles.popup = true;
              this.subtitles.message = error;
            });
        },

        "text.path": function (path) {
          tauri
            .canRead(path)
            .then((result) => {
              this.text.valid = result;
              this.text.popup = !result;
            })
            .catch((error) => {
              this.text.valid = false;
              this.text.popup = true;
              this.text.message = error;
            });
        },

        "output.path": function (path) {
          tauri
            .canWrite(path)
            .then((result) => {
              this.output.valid = result;
              this.output.popup = !result;
            })
            .catch((error) => {
              this.output.valid = false;
              this.output.popup = true;
              this.output.message = error;
            });
        },
      },

      methods: {
        popupShow(field) {
          field.popup = !field.valid;
        },

        popupHide(field) {
          field.popup = false;
        },

        async selectSubtitles() {
          await tauri.selectSubtitles().then((path) => {
            if (path != null) {
              this.subtitles.path = path;
              this.subtitles.valid = true;
            }
          });
        },

        async selectText() {
          await tauri.selectText().then((path) => {
            if (path != null) {
              this.text.path = path;
              this.text.valid = true;
            }
          });
        },

        async selectOutput() {
          await tauri.selectOutput().then((path) => {
            if (path != null) {
              this.output.path = path;
              this.output.valid = true;
            }
          });
        },

        async convert() {
          await tauri
            .convert(this.subtitles.path, this.text.path, this.output.path)
            .then(() => tauri.messageSuccess())
            .catch((error) => tauri.messageError(error));
        },

        hasErrors() {
          return (
            !this.subtitles.valid || !this.text.valid || !this.output.valid
          );
        },
      },
    })
    .mount("#app");
});
