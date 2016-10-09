(function (w) {
    "use strict";
    var StaticWebDefinition = function () {
        if (!(this instanceof StaticWebDefinition)) {
            return new StaticWebDefinition();
        }
        return this.init();
    }
    StaticWebDefinition.prototype = {
        init: function () {
        },
        retrieveTemplate: function(templateName, loadCallback, errorCallback) {
          var link = document.createElement('link');
          link.rel = 'import';
          link.href = this.getAdminPath() + "templates/" + templateName + ".html";
          //link.setAttribute('async', ''); // make it async!
          link.onload = function() {
            var templateElement = link.import.querySelector('sw-template');
            var templateContent = templateElement.children[0];
            loadCallback(templateContent);
          };
          link.onerror = errorCallback || alert;
          document.head.appendChild(link);
        },
        insertTemplate: function(template, element) {
          element.appendChild(template.cloneNode(true));
        },
        isUserLevel: function(level) {
          return level === 'visitor';
        },
        hasLoggedInInfo: function () {
            var hasTokenInfo = localStorage.getItem('token') || (window.location.search.indexOf('token') >= 0 && window.location.search.indexOf('state') >= 0);
            return hasTokenInfo;
        },
        inAdminPath: function () {
            return location.toString().indexOf(StaticWeb.getAdminPath()) !== -1;
        },
        getAdminPath: function () {
            var adminPath = '/staticweb/';
            var scripts = document.getElementsByTagName('script');
            var adminJs = 'js/swadmin.js';
            var checkerJs = 'js/swchecker.js';
            for (var i = 0; i < scripts.length; i++) {
                var url = scripts[i].src;
                if (url && url.indexOf(adminJs) >= 0) {
                    adminPath = url.replace(adminJs, '');
                    break;
                } else if (url && url.indexOf(checkerJs) >= 0) {
                    adminPath = url.replace(checkerJs, '');
                    break;
                }
            }
            if (adminPath) {
                adminPath = adminPath.replace(location.protocol + '//' + location.host, '');
            }

            return adminPath;
        },
        includeScript: function (addr) {
            var e = document.createElement('script'); e.type = 'text/javascript'; e.async = true;
            e.src = addr;
            var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(e, s);
        }
    }

    w.StaticWebDefinition = StaticWebDefinition;
    w.StaticWeb = StaticWebDefinition();
})(window);

(function (staticWeb) {
    var hasLoginLink = !!document.getElementById('staticweb-login-link');
    if (hasLoginLink || staticWeb.hasLoggedInInfo() || staticWeb.inAdminPath()) {
        var path = staticWeb.getAdminPath();
        // Load admin script(s)
        staticWeb.includeScript(path + 'js/swadmin.js');
    }
})(window.StaticWeb);
