module.exports = [
  {
    files: ["src/**/*.js"],
    languageOptions: {
      globals: {
        process: "readonly",
        require: "readonly",
        module: "readonly",
        console: "readonly"
      }
    }
  }
];

