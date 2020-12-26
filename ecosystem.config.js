module.exports = {
  apps : [{
    name: "io-event-mapper",
    script: "./index.js",
    watch: ["index.js","recipes.json"],
    error_file: 'err.log',
    out_file: 'out.log',
    time: true,
  }]
}

