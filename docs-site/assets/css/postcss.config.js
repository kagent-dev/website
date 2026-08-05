const themeDir = __dirname + '/../../';

module.exports = {
    plugins: [
        require('postcss-import')({
            path: [themeDir]
        }),
        require('tailwindcss/nesting'),
        require('tailwindcss')(themeDir + 'assets/css/tailwind.config.js'),
        ...(process.env.HUGO_ENVIRONMENT === 'production' ? [require('autoprefixer')({
            // Hugo runs PostCSS with Node filesystem permissions. Keep Browserslist
            // from walking parent directories for config or browserslist-stats.json.
            stats: {},
            overrideBrowserslist: [
                '> 0.5%',
                'last 2 versions',
                'not dead'
            ]
        }),] : [])
    ]
}
