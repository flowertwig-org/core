/* global tinymce */
(function (staticWeb) {
    "use strict";
    var Text = function () {
        if (!(this instanceof Text)) {
            return new Text();
        }

        return this.init();
    }
    Text.prototype = {
        createInterface: function () {
            var self = this;
            staticWeb.includeScript("//cdn.tinymce.com/4/tinymce.min.js");
            staticWeb.ensureLoaded('tinymce', window, function () {
                var elements = staticWeb.elements['swtext'];
                for (var index = 0; index < elements.length; index++) {
                    var element = elements[index];
                    // TODO: see if element in question have a 'data-staticweb-component-swtext-data' attribute and use that for the toolbar options
                    tinymce.init({
                        selector: '#' + element.id,
                        inline: true,
                        menubar: false,
                        browser_spellcheck: true,
                        plugins: "save",
                        toolbar: "save | bold italic | bullist numlist outdent indent | link image | undo redo",
                        save_onsavecallback: self.save
                    });
                }
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
        init: function () {
            var self = this;
        }
    }
    staticWeb.components.swText = new Text();
})(window.StaticWeb);