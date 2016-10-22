(function (staticWeb) {
  "use strict";
  var Dialog = function (element) {
    if (!(this instanceof Dialog)) {
      return new Dialog(element);
    }

    return this.init(element);
  }
  Dialog.prototype = {
    createInterface: function () {
      var self = this;

      staticWeb.retrieveTemplate("sw-onpage-page-create-dialog", function (template) {
        self._template = template;
        // get template for showing a template item in dialog
        self._itemTemplate = self._template.querySelector('sw-template-item').children[0];
        // get the dialog template
        self._dialogTemplate = self._template.querySelector('sw-dialog').children[0];

        staticWeb.insertTemplate(self._dialogTemplate, self._element);

        // set parent path in ui so user can see where new page will be placed
        var pathInput = self._element.querySelector('#sw-onpage-page-create-dialog-parent-url');
        pathInput.innerText = self._parentUrl;

        // get all available page templates and show them to user
        self.populateTemplates();
        // setup auto path generate and add page events.
        self.setupEventListeners();
      });
    },
    setPageUrl: function (url) {
      this._url = this._parentUrl + url + '/index.html';
    },
    getPageUrl: function () {
      return this._url;
    },
    getPageMetaUrl: function () {
      return this.getPageUrl().replace('/index.html', '/metadata.json');
    },
    setPageName: function (name) {
      this._name = name;
    },
    getPageName: function () {
      return this._name;
    },
    _correctPath: function (url) {
      return url.toLowerCase().replace(/[^a-z0-9]/g, '-');
    },
    setupEventListeners: function () {
      var self = this;
      var element = self._element;

      // our dialog needs to be closabe, this will remove dialog when clicking close button
      var closeBtn = element.querySelector('.sw-onpage-dialog-close');
      closeBtn.addEventListener('click', function () {
        element.remove();
      });

      // We want help user by automatically create a path from the name *he enters.
      var pageNameInput = element.querySelector('#sw-onpage-page-create-dialog-name');
      var pageUrlInput = element.querySelector('#sw-onpage-page-create-dialog-url');
      pageNameInput.addEventListener('keyup', function (e) {
        var name = pageNameInput.value;
        self.setPageName(name);

        var url = self._correctPath(name);
        self.setPageUrl(url);

        pageUrlInput.value = url;
      });

      // when user changes the path directly, make sure it still follows the url rules
      pageUrlInput.addEventListener('keyup', function (e) {
        var ev = e || event;
        if (ev.which < 40 ||
          ev.ctrlKey || ev.metaKey || ev.altKey) {
          return;
        }

        pageUrlInput.value = self._correctPath(pageUrlInput.value);
        self.setPageUrl(pageUrlInput.value);
      });

      // when user has entered all required inputs and clicks 'create page' we need verify that we have all info and then create page
      var link = document.querySelector('.sw-onpage-page-create-dialog-add-page');
      link.addEventListener('click', function () {
        // Do we have valid template?
        var selectedTemplate = self._element.querySelector('[type=radio]:checked');
        if (!selectedTemplate) {
          alert('You need to select a template to use');
          return;
        }
        // get page template path
        var templateId = selectedTemplate.id;
        var templateLocation = self._templates[templateId];

        // Do we have a valid page url?
        if (!self.getPageUrl()) {
          alert('You need to enter a page name to use');
          return;
        }

        // Do we have a valid page name?
        if (!self.getPageName()) {
          alert('You need to enter a page url to use');
          return;
        }

        // create metadata information for page
        var data = {
          'name': self.getPageName(),
          'url': self.getPageUrl(),
          'layout': templateLocation
        };
        var metadataContent = JSON.stringify(data);

        // Write metadata file to storage
        staticWeb.addResource(self.getPageMetaUrl(), metadataContent, function () { });
        // write page to storage
        staticWeb.addPage(self.getPageUrl(), templateLocation, function () {
          var dialogContent = self._element.querySelector('.sw-onpage-page-create-dialog-content');
          dialogContent.innerHTML = "waiting for servers to empty cache, please wait";
          // this function will wait until page is available on server and then redirect user to new page
          self.waitUntilReady(self.getPageUrl());
        });
        return;
      });

    },
    waitUntilReady: function (addr) {
      var self = this;
      var iframe = document.createElement('iframe');
      var timeout = setTimeout(function () {
        // Clean up iframe
        try {
          iframe.parentElement.removeChild(iframe);
        } catch (error) {
          // do nothing, it is not that critical
        }
        // Do a new try
        self.waitUntilReady(addr);
      }, 1000);
      iframe.onload = function () {
        var scripts = iframe.contentDocument.scripts;
        var hasValidScript = false;
        var test = staticWeb.getAdminPath();

        for (var i = 0; i < scripts.length; i++) {
          if (document.scripts[i].src.indexOf(test)) {
            hasValidScript = true;
            break;
          }
        }
        if (hasValidScript) {
          clearTimeout(timeout);
          // Clean up iframe
          iframe.parentElement.remove(iframe);
          location.assign(addr); // change location to parent
        }
      };
      // by adding timestamp to url the webserver should not cache this entry, make it possible to check when page has been created
      iframe.src = addr + "?nocache=" + new Date().getTime();
      document.body.appendChild(iframe);
    },
    populateTemplates: function () {
      var self = this;
      var adminPath = staticWeb.getAdminPath();

      var templateContainer = self._element.querySelector('.sw-onpage-page-create-dialog-content-templates');


      staticWeb.storage.list(adminPath + 'config/layouts/page/', function (info, status) {
        var list = info;
        if (!list || list.length === 0) {
          templateContainer.innerHTML = '<span>No page layouts found. Please add page layouts to: ' + adminPath + 'config/layouts/page/</span>';
          return;
        }

        var list = arguments[0];
        var elements = [];

        // reset template container content
        templateContainer.innerHTML = '';

        for (var i = 0; i < list.length; i++) {
          var path = list[i].path;
          var isTemplate = path.indexOf('.html') > 0 || path.indexOf('.htm') > 0;
          if (!isTemplate) {
            // we are only interested in templates, ignore rest of files in directory.
            continue;
          }
          // get a more nice looking template name to show user
          var name = list[i].name.replace('.html', '').replace('.htm', '').replace('-', ' ');
          // for every template we will check if there is a preview image for it (if it is, we will use it instead of showing template in iframe)
          // YES, only supporting jpg formats here is good enough.... :)
          var previewImagePath = path.replace('.html', '.jpg').replace('.htm', '.jpg');

          var templateNode = self._itemTemplate.cloneNode(true);
          var radio = templateNode.querySelector('input[type=radio]');
          // generate temporary template id so we know what template user choosed later and set it on radio and label...
          var templateId = 'sw-onpage-page-create-dialog-template-' + i;
          radio.setAttribute('id', templateId);
          var label = templateNode.querySelector('label');
          label.setAttribute('for', 'sw-onpage-page-create-dialog-template-' + i);

          // store temporary template id and path relation to later use
          self._templates[templateId] = path;

          // set template name
          var header = templateNode.querySelector('b');
          header.innerText = name;

          // If we have an preview image for page we want to show it
          var img = templateNode.querySelector('img');
          var iframe = templateNode.querySelector('iframe');

          if (img) {
            img.onerror = function () {
              // If no preview image can be found, hide img element.
              this.style.display = 'none';
              // and show template in iframe
              var iframe = this.nextElementSibling;
              if (iframe) {
                // as no preview image was set for templat, show template in iframe
                iframe.setAttribute('src', iframe.getAttribute('data-staticweb-src'));
                iframe.style.display = 'block';
              }
            }
            // Try loading preview image (If none are found, we will use iframe solution instead)
            img.setAttribute('src', previewImagePath);
          }

          // we want o store
          var iframe = templateNode.querySelector('iframe');
          if (iframe) {
            iframe.setAttribute('data-staticweb-src', path);
          }

          templateContainer.appendChild(templateNode);
        }
      });
    },
    onStorageReady: function (storage) {
      var self = this;
    },
    init: function (element) {
      var self = this;
      self._element = element;
      self._parentUrl = self._element.getAttribute('data-staticweb-component-navnode-path');

      self._name = false;
      self._url = false;
      self._templates = {};

      self.createInterface();
    }
  }
  staticWeb.registerComponent('sw-onpage-page-create-dialog', Dialog);

})(window.StaticWeb);