// Find the full example of all available configuration options at
// https://github.com/muenzpraeger/create-lwc-app/blob/main/packages/lwc-services/example/lwc-services.config.js
module.exports = {
    resources: [
        { from: 'src/client/resources/', to: 'dist/resources/'},
        { from: 'src/server/calculateCorr.js', to: 'dist/calculateCorr.js' },
        { from: 'src/server/ftpAccess.js', to: 'dist/ftpAccess.js' },
        { from: 'src/server/points.js', to: 'dist/points.js' },
        { from: 'src/server/vlfdata.js', to: 'dist/vlfdata.js' },
        { from: 'src/server/VLF-data', to: 'dist/VLF-data' }
      ],

    sourceDir: './src/client',

    devServer: {
        proxy: { '/': 'http://localhost:3002' }
    }
};
