(function (staticWeb) {
    "use strict";
    var Login = function () {
        if (!(this instanceof Login)) {
            return new Login();
        }

        return this.init();
    }
    Login.prototype = {
        createInterface: function () {
          staticWeb.includeStyle(staticWeb.getAdminPath() + 'css/swadminzone.css');
          var templateName = 'swlogin-LoggedOut';
          if(staticWeb.hasLoggedInInfo()) {
            templateName = 'swlogin-LoggingIn';
          }
          staticWeb.retrieveTemplate(templateName, function(template) {
            var elements = staticWeb.elements.swlogin.instances;
            for (var i = 0; i < elements.length; i++) {
              staticWeb.insertTemplate(template, elements[i]);
            }
          });
        },
        onStorageReady: function (storage) {
            var self = this;
            if (staticWeb.isUserLevel('admin')) {
              var elements = staticWeb.elements.swlogin.instances;
              for (var i = 0; i < elements.length; i++) {
                elements[i].style.display = 'none';
              }
            }
        },
        init: function () {
            var self = this;
            self.createInterface();
        }
    }
    staticWeb.components.swLogin = Login();
})(window.StaticWeb);
