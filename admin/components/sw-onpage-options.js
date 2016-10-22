(function (staticWeb) {
  "use strict";
  var Options = function (element) {
    return this.init(element);
  }
  Options.prototype = {
    createInterface: function () {
      var self = this;
      var adminPath = staticWeb.getAdminPath();

      staticWeb.retrieveTemplate("sw-onpage-options", function (template) {
        var tmp = template.cloneNode(true);

        staticWeb.insertTemplate(tmp, self._element);

        // Show/hide options menu and track when it changes
        self.trackOptionsOpenState(self._element);
        // Show/hide pages panel and track when it changes
        self.trackPanelPageOpenState(self._element);

        staticWeb.loadComponents();
      });
    },
    trackPanelPageOpenState: function (element) {
      var appDisplay = staticWeb.config.onPage.navigation.display;
      var userDisplay = staticWeb.getUserSetting('sw.config.onPage.navigation.display');

      var checkbox = element.querySelector('#sw-panel-list-item-pages-checkbox');
      if (appDisplay == 'always' || userDisplay == 'always') {
        checkbox.checked = true;
      }

      checkbox.addEventListener('change', function (e) {
        var value = checkbox.checked ? 'always' : 'onDemand';
        staticWeb.setSetting('sw.config.onPage.navigation.display', value);
        return;
      });
    },
    trackOptionsOpenState: function (element) {
      var appDisplay = staticWeb.config.onPage.display;
      var userDisplay = staticWeb.getUserSetting('sw.config.onPage.display');

      var optionsCheckbox = element.querySelector('#sw-panel-left-checkbox');
      if (appDisplay == 'always' || userDisplay == 'always') {
        optionsCheckbox.checked = true;
      }

      optionsCheckbox.addEventListener('change', function (e) {
        var value = optionsCheckbox.checked ? 'always' : 'onDemand';
        staticWeb.setSetting('sw.config.onPage.display', value);
        return;
      });
    },
    onStorageReady: function (storage) {
      var self = this;
    },
    init: function (element) {
      var self = this;
      self._element = element;
      self.createInterface();
    }
  }
  staticWeb.registerComponent('sw-onpage-options', Options);
})(window.StaticWeb);
