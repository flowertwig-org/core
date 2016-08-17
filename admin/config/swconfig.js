/* global StaticWeb */
(function (sw) {
    sw.config.storage = {
        'type': 'github',
        'repo': 'flowertwig-org/brfskagagardAdmin',
        'tokenService': 'https://brfskagagard-inloggning.azurewebsites.net?appName=member-test'
    }
    sw.config.user = {
        'timeout': 60 * 60 * 24 * 7, // Time settings is stored on user device (currently: 7 days)
    };
    sw.config.permissions = {
        'check': true, /* Only needed if you want different accessability rights. Currently only possible when using github storage */
        'storages': {
            'flowertwig-org/brfskagagardAdmin': {
                'type': 'admin',
                'required': ['admin']
            },
            'flowertwig-org/brfskagagard-lgh': {
                'type': 'member',
                'required': ['admin', 'write', 'read']
            }
        }
    };
    sw.config.cookieName = 'staticweb-token';
    sw.config.onPage = {
        // Tells StaticWeb show general menu, options and more not present as components on page
        'display': 'onDemand', // 'onDemand', 'always', 'no' 
        'navigation': {
            'display': 'onDemand', // 'onDemand', 'always', 'no'
            'ignorePaths': ['.gitignore', 'README.md', 'img', 'css', 'docs', 'admin', 'LICENSE', 'parking.html']
        }
    };
})(StaticWeb);
