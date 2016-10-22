(function (staticWeb) {
  "use strict";
  var Login = function (element) {
    if (!(this instanceof Login)) {
      return new Login(element);
    }

    return this.init(element);
  }
  Login.prototype = {
    createInterface: function () {
      var self = this;
      staticWeb.includeStyle(staticWeb.getAdminPath() + 'css/swadminzone.css');
      var templateName = 'swlogin-LoggedOut';
      if (staticWeb.hasLoggedInInfo()) {
        templateName = 'swlogin-LoggingIn';
      }
      staticWeb.retrieveTemplate(templateName, function (template) {
        staticWeb.insertTemplate(template, self._element);
      });
    },
    onStorageReady: function (storage) {
      var self = this;
      if (staticWeb.isUserLevel('admin')) {
        self._element.style.display = 'none';
      }
    },
    init: function (element) {
      var self = this;
      self._element = element;
      self.createInterface();
    }
  }
  staticWeb.registerComponent('sw-login', Login);
})(window.StaticWeb);
