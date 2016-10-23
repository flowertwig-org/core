/* global tinymce */
(function (staticWeb) {
    "use strict";
    var Text = function (element) {
        if (!(this instanceof Text)) {
            return new Text(element);
        }

        return this.init(element);
    }
    Text.prototype = {
        createInterface: function () {
            var self = this;
            if (self._loaded) {
                return;
            }
            self._loaded = true;
            staticWeb.includeScript("https://cdn.tinymce.com/4/tinymce.min.js");
            staticWeb.ensureLoaded('tinymce', window, function () {
                    // TODO: see if element in question have a 'data-staticweb-component-swtext-data' attribute and use that for the toolbar options
                    tinymce.init({
                        selector: '#' + self._element.id,
                        inline: true,
                        menubar: false,
                        browser_spellcheck: true,
                        plugins: "save",
                        toolbar: "save | bold italic | bullist numlist outdent indent | link image | undo redo",
                        save_onsavecallback: self.save
                    });
            });
        },
        onStorageReady: function (storage, permissions) {
            var self = this;
            if (!staticWeb.config.permissions.check || permissions.indexOf('admin') > 0) {
                self.createInterface();
            }
        },
        save: function (editor) {
            if (editor && editor.startContent) {
                var resourceName = location.pathname.substring(1);
                if (!resourceName || resourceName[resourceName.length - 1] == '/') {
                    resourceName += 'index.html';
                }

                var container = editor.bodyElement;
                var content = container.innerHTML;

                staticWeb.updatePage(container.id, container.tagName, resourceName, content);
            }
        },
        init: function (element) {
            var self = this;
            self._element = element;
            self._loaded = false;
            if (staticWeb.storage) {
                self.createInterface();
            }
        }
    }
    staticWeb.registerComponent('sw-text', Text);

})(window.StaticWeb);