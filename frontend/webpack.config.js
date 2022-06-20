const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

// For local testing, put the internet identity canister id here
// const LOCAL_II_CANISTER_ID = 'rkp4c-7iaaa-aaaaa-aaaca-cai';
const LOCAL_II_CANISTER_ID = 'rdmx6-jaaaa-aaaaa-aaadq-cai';
// url for the local internet identity canister
const LOCAL_II_CANISTER = `http://${LOCAL_II_CANISTER_ID}.localhost:8000/#authorize`;

function initCanisterEnv() {
  let localCanisters, prodCanisters;
  try {
    localCanisters = require(path.resolve(
      "../backend",
      ".dfx",
      "local",
      "canister_ids.json"
    ));
    console.log("local canisters", localCanisters);
  } catch (error) {
    console.log("No local canister_ids.json found. Continuing production");
  }
  try {
    prodCanisters = require(path.resolve("canister_ids.json"));
  } catch (error) {
    console.log("No production canister_ids.json found. Continuing with local");
  }

  const network =
    process.env.DFX_NETWORK ||
    (process.env.NODE_ENV === "production" ? "ic" : "local");

  const canisterConfig = network === "local" ? localCanisters : prodCanisters;

  console.log("canisterConfig", canisterConfig)
  return Object.entries(canisterConfig).reduce((prev, current) => {
    const [canisterName, canisterDetails] = current;
    prev[canisterName.toUpperCase() + "_CANISTER_ID"] =
      canisterDetails[network];
    return prev;
  }, {}); // TODO: make people authenticate if want to restrict access to the demo { LOCAL_II_CANISTER });
}
const canisterEnvVariables = initCanisterEnv();
console.log('canisterEnvVariables', canisterEnvVariables)

const isDevelopment = process.env.NODE_ENV !== "production";

const frontendDirectory = "./";
const asset_entry = path.join("src", "index.html");

module.exports = {
  target: "web",
  mode: isDevelopment ? "development" : "production",
  entry: {
    // The frontend.entrypoint points to the HTML file for this build, so we need
    // to replace the extension to `.js`.
    index: "./src/index.tsx", //path.join(__dirname, asset_entry).replace(/\.html$/, ".tsx"),
  },
  devtool: isDevelopment ? "source-map" : false,
  optimization: {
    minimize: !isDevelopment,
    minimizer: [new TerserPlugin()],
  },
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx"],
    fallback: {
      assert: require.resolve("assert/"),
      buffer: require.resolve("buffer/"),
      events: require.resolve("events/"),
      stream: require.resolve("stream-browserify/"),
      util: require.resolve("util/"),
    },
  },
  output: {
    filename: "index.js",
    path: path.join(__dirname, "dist", frontendDirectory),
  },

  // Depending in the language or framework you are using for
  // front-end development, add module loaders to the default
  // webpack configuration. For example, if you are using React
  // modules and CSS as described in the "Adding a stylesheet"
  // tutorial, uncomment the following lines:
  module: {
  rules: [
      { test: /\.(ts|tsx|jsx)$/, loader: "ts-loader" },
      { test: /\.css$/, use: ['style-loader','css-loader'] }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, asset_entry),
      cache: false,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.join(__dirname, "src/", frontendDirectory, "./index.css"),
          to: path.join(__dirname, "dist", frontendDirectory),
        },
      ],
    }),
    new webpack.EnvironmentPlugin({
      NODE_ENV: "development",
      ...canisterEnvVariables,
    }),
    new webpack.ProvidePlugin({
      Buffer: [require.resolve("buffer/"), "Buffer"],
      process: require.resolve("process/browser"),
    }),
  ],
  // proxy /api to port 8000 during development
  devServer: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        pathRewrite: {
          "^/api": "/api",
        },
      },
    },
    hot: true,
  },
};
