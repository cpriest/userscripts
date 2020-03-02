const path              = require('path');
const WebpackUserscript = require('webpack-userscript');

const { outputDir, version, updateURL } = {
	development: {
		outputDir: 'dist',
		version:   `[version]-build.[buildTime]`,
		updateURL: 'http://localhost:8080/table-tool.user.js',
	},
	production:  {
		outputDir: 'release',
		version:   `[version]`,
		updateURL: 'https://raw.githubusercontent.com/cpriest/userscripts/master/table-tool/release/table-tool.user.js',
	},
}[process.env.NODE_ENV];

module.exports = {
	mode:         process.env.NODE_ENV,
	optimization: {
		usedExports:
			true,
	},
	entry:        {
		'table-tool': path.resolve(__dirname, 'src', 'index.js'),
	},
	output:       {
		path:     path.resolve(__dirname, outputDir),
		filename: '[name].user.js',
	},
	devServer:    {
		contentBase: path.join(__dirname, outputDir),
		https: true,
		disableHostCheck: true,
		headers: {
			'Access-Control-Allow-Origin':  '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
			'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
		},
	},
	devtool: 'eval-source-map',
//	watchOptions: {
//		aggregateTimeout: 1000,
//	},
	module: {
		rules: [
			{
				test: /\.css$/,
				use:  [
					'style-loader',
					'css-loader'
				],
				sideEffects: true,
			}
		]
	},
	plugins:      [
//		new HotModulePlugin({
//			noInfo: true,
//		}),
		new WebpackUserscript({
			headers: {
				name:      'table-tool',
				version:   version,
				homepage:  'https://github.com/cpriest/userscripts/tree/master/table-tool/',
				updateURL: updateURL,
				namespace: 'cmp.tt',
				grant:     ['none'],
				match:     'none',
//				require:   [
//					'https://unpkg.com/hotkeys-js/dist/hotkeys.min.js',
//					'https://unpkg.com/mathjs/dist/math.min.js',
//					'https://unpkg.com/sprintf-js/dist/sprintf.min.js',
//				],
			},
		}),
	],
};
