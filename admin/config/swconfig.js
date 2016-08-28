/* global StaticWeb */
(function (sw) {
    sw.config.storage = {
        'type': 'github',
        'repo': 'StaticWebCMS/core',
        'tokenService': 'https://brfskagagard-inloggning.azurewebsites.net?appName=admin-dev'
    }
    sw.config.permissions = {
        'check': false, /* Only needed if you want different accessability rights. Currently only possible when using github storage */
        'storages': {
            'StaticWebCMS/core': {
                'type': 'admin',
                'required': ['admin']
            },
            'StaticWebCMS/demo': {
                'type': 'member',
                'required': ['admin', 'write', 'read']
            }
        }
    };
    sw.config.onPage = {
        // Tells StaticWeb show general menu, options and more not present as components on page
        'display': 'onDemand', // 'onDemand', 'always', 'no' 
        'navigation': {
            'display': 'onDemand', // 'onDemand', 'always', 'no'
            'ignorePaths': ['.gitignore', 'README.md', 'img', 'css', 'docs', 'admin', 'LICENSE', 'parking.html']
        }
    };
})(StaticWeb);
