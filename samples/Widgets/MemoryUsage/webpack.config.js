module.exports = {
    devtool: 'source-map',
    entry: './src/MemoryUsage.jsx',
    output: {
        path: __dirname + 'dist',
        filename: 'MemoryUsage.js'
    },
    module: {
        loaders: [
            {
                test: /\.json$/,
                loader: 'json-loader'
            },
            {
                exclude: __dirname + '/node_modules',
                test: /\.(js|jsx)$/,
                loader: 'babel-loader'
            },

            {
                test: /\.css$/,
                loader: 'style-loader!css-loader'
            },
            {
                test: /\.scss$/,
                loaders: ['style-loader', 'css-loader', 'sass-loader']
            }

        ]
    },
    devServer: {
        contentBase: './samples/public',

        historyApiFallback: true,
        inline: true,
        port: 9000
    }
};