define([], function () {
  const { invoke } = window.__TAURI__.tauri;
  const { message, open, save } = window.__TAURI__.dialog;

  return {
    async canRead(path) {
      return invoke("can_read", { path });
    },

    async canWrite(path) {
      return invoke("can_write", { path });
    },

    async convert(subtitles, text, result) {
      return invoke("convert", { subtitles, text, result });
    },

    async selectSubtitles() {
      return open({
        title: "Select subtitles",
        multiple: false,
        filters: [
          { name: "Subtitle files (*.srt; *.txt)", extensions: ["srt", "txt"] },
          { name: "All files (*.*)", extensions: ["*"] },
        ],
      });
    },

    async selectText() {
      return open({
        title: "Select translation",
        multiple: false,
        filters: [
          { name: "Subtitle files (*.txt)", extensions: ["txt"] },
          { name: "All files (*.*)", extensions: ["*"] },
        ],
      });
    },

    async selectOutput() {
      return save({
        title: "Select output file",
        filters: [
          { name: "Subtitle files (*.srt; *.txt)", extensions: ["srt", "txt"] },
          { name: "All files (*.*)", extensions: ["*"] },
        ],
      });
    },

    async messageSuccess() {
      return message("Text successfully replaced", {
        title: "Convert Subtitles",
        type: "info",
      });
    },

    async messageError(error) {
      return message("Text with error: " + error, {
        title: "Convert Subtitles",
        type: "warning",
      });
    },

    greet(name) {
      return invoke("greet", { name });
    },
  };
});
