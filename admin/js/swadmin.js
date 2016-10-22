/* global freightCrane */
(function (w, undefined) {
    "use strict";

    var StaticWebDefinition = w.StaticWebDefinition || function () {
        if (!(this instanceof StaticWebDefinition)) {
            return new StaticWebDefinition();
        }
        this.init();
    }
    StaticWebDefinition.prototype.init = function () {
        var self = this;

        this.config = {};
        // all loaded components should store themself here.
        this.components = {};
        this.permissionTypes = ['visitor'];

        this.storage = false;

        // load components that doesn't require permissions except 'visitor'
        this.loadComponents();

        // Do we have a valid token?
        if (this.hasLoggedInInfo()) {
            this.loadLoggedInState();
        }
    }

    StaticWebDefinition.prototype.setSetting = function (key, value) {
        localStorage.setItem(key, value);
    }
    StaticWebDefinition.prototype.getUserSetting = function (key) {
        var value = localStorage.getItem(key);
        return value;
    }

    StaticWebDefinition.prototype.getSetting = function (key) {
        var obj = this.getUserSetting(key);
        if (!obj) {
            var keys = key.split('.').reverse();
            return this.getSettingFromObject(keys, window);
        }
        return obj;
    }

    StaticWebDefinition.prototype.getSettingFromObject = function (keys, obj) {
        var key = keys.pop();

        if (key === "sw") {
            key = "StaticWeb";
        }

        if (keys.length) {
            var obj = obj[key];
            return this.getSettingFromObject(keys, obj);
        } else {
            var value = obj[key];
            return value;
        }
    }
    StaticWebDefinition.prototype.hasHtmlImportSupport = function (callback) {
        var hasNativeSupport = 'import' in document.createElement('link');
        return hasNativeSupport;
    }
    StaticWebDefinition.prototype.ensureHtmlImportSupport = function (callback) {
        var self = this;
        if (self.hasHtmlImportSupport()) {
            callback();
        } else {
            var adminPath = this.getAdminPath();

            var webcomponentsFolder = adminPath + 'bower_components/webcomponentsjs/';
            self.includeScript(webcomponentsFolder + 'HTMLImports.min.js');
            self.ensureLoaded('HTMLImports', window, function () {
                // we should have HTML Imports support now, continue...
                callback();
            });
        }
    }
    StaticWebDefinition.prototype.retrieveTemplate = function (templateName, loadCallback, errorCallback) {
        var self = this;

        self._htmlImportPolyfill = self._htmlImportPolyfill || false;

        if (!self.hasHtmlImportSupport() && !self._htmlImportPolyfill) {
            // browser doesn't support HTML Imports, try load polyfill
            self.ensureHtmlImportSupport(function() {

                self._htmlImportPolyfill = true;

                self.retrieveTemplate(templateName, loadCallback, errorCallback);
            });
            return;
        }

        var templateId = 'template-' + templateName;
        var link = document.querySelector('#' + templateId);

        // have we loaded template already?
        if (link) {
            var templateElement = link.import.querySelector('sw-template');
            var templateContent = templateElement.children[0];
            loadCallback(templateContent);
        } else {
            var link = document.createElement('link');
            link.id = templateId;
            link.rel = 'import';
            link.href = this.getAdminPath() + "templates/" + templateName + ".html";
            //link.setAttribute('async', ''); // make it async!
            link.onload = function () {
                var templateElement = link.import.querySelector('sw-template');
                var templateContent = templateElement.children[0];
                loadCallback(templateContent);
            };
            link.onerror = errorCallback || alert;
            document.head.appendChild(link);
        }
    }
    StaticWebDefinition.prototype.insertTemplate = function (template, element) {
        element.appendChild(template.cloneNode(true));
    }
    StaticWebDefinition.prototype.isUserLevel = function (level) {
        return level === 'visitor';
    }

    StaticWebDefinition.prototype.includeStyle = function (addr) {
        var link = document.createElement('link');
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.href = addr;
        var s = document.getElementsByTagName('head')[0];
        s.appendChild(link, s);
    }

    StaticWebDefinition.prototype.loadLoggedInState = function () {
        var self = this;
        var adminPath = this.getAdminPath();

        var freightCraneFolder = adminPath + 'node_modules/freightCrane/';
        this.includeScript(freightCraneFolder + 'freightCrane.js');
        this.includeScript(adminPath + 'config/swconfig.js');
        self.ensureLoaded('storage', self.config, function () {
            // We have now loaded the StaticWeb config.

            self.ensureLoaded('freightCrane', window, function () {
                self.includeScript(freightCraneFolder + 'freightCrane.' + self.config.storage.type + '.js');
                self.ensureLoaded(self.config.storage.type, freightCrane.providers, function () {
                    var freightCraneConf = self.config.storage;
                    freightCraneConf.name = freightCraneConf.type;
                    freightCraneConf.callback = function (storage, callStatus) {
                        self.storage = storage;
                        if (self.config.permissions.check) {
                            // Only storages with support for permissions can
                            // "checkPermissions". E.g: Github.
                            self.checkPermissions(storage, self.notifyComponentsOfStorageReady);
                            self.loadComponents()
                        } else {
                            // Storages that don't support permissions default
                            // to requiring admin.
                            self.permissionTypes = ["admin"];
                            self.loadComponents()
                            self.notifyComponentsOfStorageReady(storage, self.permissionTypes);
                        }
                    };
                    freightCrane(freightCraneConf);
                });
            });
        });
    }
    StaticWebDefinition.prototype.isUserLevel = function (level) {
        var self = this;
        return ((self.config.permissions && !self.config.permissions.check) || self.permissionTypes.indexOf(level) >= 0)
    }
    StaticWebDefinition.prototype.checkPermissions = function (storage, callback) {
        var self = this;

        storage.listStorages(function (repos) {
            for (var index = 0; index < repos.length; index++) {
                var currentRepo = repos[index];
                var path = currentRepo.path;
                var types = self.permissionTypes;

                var permissionList = self.config.permissions.storages;
                for (var permName in permissionList) {
                    if (path.indexOf(permName) === 0) {
                        // We have a match in repo names
                        var permObj = permissionList[permName];
                        if (permObj.required.indexOf('admin') >= 0 && currentRepo.permissions.admin) {
                            types.push(permObj.type);
                            break;
                        } else if (permObj.required.indexOf('write') >= 0 && currentRepo.permissions.write) {
                            types.push(permObj.type);
                            break;
                        } else if (permObj.required.indexOf('read') >= 0 && currentRepo.permissions.read) {
                            types.push(permObj.type);
                            break;
                        }
                        currentRepo.permissions
                    }
                }
                self.permissionTypes = types;
            }
            callback.call(self, storage, self.permissionTypes);
        });
    }
    StaticWebDefinition.prototype.notifyComponentsOfStorageReady = function (storage, permissions) {
        var self = this;

        if (self.isUserLevel('admin')) {
            self.loadAdminState(permissions);
        }

        for (var compName in self.components) {
            var component = self.components[compName];
            for (var index = 0; index < component.instances.length; index++) {
                var instance = component.instances[index];
                if ('onStorageReady' in instance) {
                    instance.onStorageReady(storage, permissions);
                }
            }
        }
    }
    StaticWebDefinition.prototype.loadAdminState = function (loggedIn) {
        var self = this;
        var adminPath = this.getAdminPath();

        if (loggedIn) {
            self.config.storage.isReady = true;
        } else {
            alert('Ogiltigt personligt åtkomsttoken.');
            // token from freightCrane seems invalid, remove it and reload page.
            localStorage.removeItem('token');
            location.reload();
        }
    }
    StaticWebDefinition.prototype.addResource = function (resourceName, data, callback) {
        // TODO: queue requests that are done until we have a valid storage
        this.storage.set(resourceName, data, function (fileMeta, callStatus) {
            if (callStatus.isOK) {
                if (callback) {
                    callback();
                } else {
                    alert('saved');
                }
            } else {
                alert('fail, error code: 1');
            }
        });
    }
    StaticWebDefinition.prototype.addPage = function (pageName, templatePath, callback) {
        var self = this;
        this.storage.get(templatePath, function (file, callStatus) {
            if (callStatus.isOK) {
                var data = file.data;
                // Disallowed chars regex
                var regexp = /([^a-z0-9!{}<>/\;&#\:\ \=\\r\\n\\t\"\'\%\*\-\.\,\(\)\@])/gi;
                data = data ? data.replace(regexp, '') : '';
                self.addResource(pageName, data, callback);
            } else {
                alert('fail, error code: 2');
            }
        });
    }
    StaticWebDefinition.prototype.updateResource = function (resourceName, data) {
        // TODO: queue requests that are done until we have a valid storage
        // NOTE: We can only update file if we have previously called getResource....
        this.storage.set(resourceName, data, function (fileMeta, callStatus) {
            if (callStatus.isOK) {
                alert('saved');
            } else {
                alert('failed to update, please wait a minute and try again.');
            }
        });
    }
    StaticWebDefinition.prototype.updateCurrentPage = function () {
        var resourceName = location.pathname.substring(1);
        if (resourceName.length == 0) {
            resourceName = "index.html";
        }
        if (resourceName[resourceName.length - 1] === '/') {
            resourceName = resourceName + "index.html";
        }
        this.updatePage(resourceName);
    }
    StaticWebDefinition.prototype.updatePage = function (containerId, containerTagName, resourceName, content) {
        var self = this;

        content = this.encodeToHtml(content);
        content = content.replace(regexp, '');

        // Disallowed chars regex
        var regexp = /([^a-z0-9!{}<>/\;&#\:\ \=\\r\\n\\t\"\'\%\*\-\.\,\(\)\@])/gi;

        self.storage.get(resourceName, function (file, callStatus) {
            if (callStatus.isOK) {
                var data = file.data;
                data = data ? data.replace(regexp, '') : '';

                var index = data.indexOf('id="' + containerId + '"');
                index = data.indexOf('>', index);
                index++;

                var tagName = containerTagName.toLowerCase();
                var tmp = data.substring(index);

                var endIndex = 0;
                var startIndex = 0;
                var tagsInMemory = 0;

                var found = false;
                var insanityIndex = 0;
                while (!found && insanityIndex < 10000) {
                    insanityIndex++;
                    endIndex = tmp.indexOf('</' + tagName, endIndex);
                    startIndex = tmp.indexOf('<' + tagName, startIndex);

                    if (startIndex == -1) {
                        // we have not found a start tag of same type so we have found our end tag.
                        if (tagsInMemory == 0) {
                            tmp = tmp.substring(0, endIndex);
                            found = true;
                        } else {
                            tagsInMemory--;
                            endIndex += tagName.length + 2;
                            startIndex = endIndex;
                        }
                    } else if (endIndex < startIndex) {
                        // start tag was found after our end tag so we have found our end tag.
                        if (tagsInMemory == 0) {
                            tmp = tmp.substring(0, endIndex);
                            found = true;
                        } else {
                            tagsInMemory--;
                            endIndex += tagName.length + 2;
                            startIndex = endIndex;
                        }
                    } else {
                        tagsInMemory++;
                        startIndex += tagName.length + 1;
                        endIndex = startIndex;
                    }
                }

                tmp = tmp.substring(0, endIndex);

                if (data.indexOf(tmp) >= 0) {
                    // We have not reproduced same start content, now, replace it :)
                    var newData = data.replace(tmp, content);
                    if (newData.indexOf('<meta name="generator" content="StaticWeb" />') == -1) {
                        newData = newData.replace('</head>', '<meta name="generator" content="StaticWeb" /></head>');
                    }

                    self.updateResource(resourceName, newData);
                } else {
                    alert('Could not update page, no matching content');
                }
            }
        })
    }
    StaticWebDefinition.prototype.componentPermitted = function (element) {
        var self = this;
        var componentPermissionType = 'admin';

        // check if component have set required permission type
        var componentPermRequireAttr = element.attributes['data-staticweb-perm-type'];
        if (componentPermRequireAttr) {
            componentPermissionType = componentPermRequireAttr.value;
        }

        // If component required permission isnt available, ignore it. BUT if it has specified 'visitor', automatically approve it.
        var isVisitor = componentPermissionType === 'visitor';
        var isPermitted = self.permissionTypes.indexOf(componentPermissionType) !== -1;
        if (isVisitor || isPermitted) {
            return true;
        }
        return false;
    }
    StaticWebDefinition.prototype.initComponent = function (element, componentName, attributes) {
        var component = document.createElement('div');
        component.setAttribute('data-staticweb-component', componentName);
        var hasId = component.id;
        if (!hasId) {
            component.id = 'sw-' + new Date().getTime();
        }
        if (attributes) {
            for (var name in attributes) {
                component.setAttribute(name, attributes[name]);
            }
        }
        element.appendChild(component);
        this.loadComponents();
    }
    StaticWebDefinition.prototype.registerComponent = function (componentName, component) {
        if (this.components[componentName]) {
            this.components[componentName].definition = component;
            this.components[componentName].registered = true;
        }
        this.loadComponents();
    }
    StaticWebDefinition.prototype.loadComponents = function () {
        var self = this;
        var adminPath = self.getAdminPath();

        // Find elements that should be created as components
        var domElements = document.querySelectorAll('[data-staticweb-component]');
        for (var index = 0; index < domElements.length; index++) {
            var domElement = domElements[index];
            if (!self.componentPermitted(domElement)) {
                continue;
            }

            var componentTypeName = domElement.getAttribute('data-staticweb-component');
            if (componentTypeName) {
                var component = self.components[componentTypeName];
                // If this is the first component of this type, create array
                if (!component) {
                    component = self.components[componentTypeName] = {
                        loaded: false,
                        registered: false,
                        instances: [],
                        elements: [],
                        definition: false
                    };
                }

                // component definition has been loaded and is ready to use, init on element.
                if (component.loaded && component.registered) {
                    // add element to known elements for type
                    var componentInitialized = component.elements.indexOf(domElement) !== -1;
                    if (!componentInitialized) {
                        // add element
                        component.elements.push(domElement);
                        // create instance
                        component.instances.push(new component.definition(domElement));
                    }
                }
            }
        }

        // Load all components we have found
        // We are waiting until we have gone through all elements because there can be multiple elements of same component type
        // and we want to be sure self.elements contains all of our types when component is loaded )
        for (var key in self.components) {
            var isLoaded = self.components[key].loaded;
            var isRegistered = self.components[key].registered;
            if (!isLoaded || !isRegistered) {
                // javascript component has not been loaded or registered, load it (If it is still not registered, component is broken).
                self.components[key].loaded = true;
                self.includeScript(adminPath + 'components/' + key + '.js');
            }
        }
    }
    StaticWebDefinition.prototype.ensureLoaded = function (name, container, callback) {
        var self = this;
        setTimeout(function () {
            if (name in container) {
                callback();
            } else {
                self.ensureLoaded(name, container, callback);
            }
        }, 100);
    }
    StaticWebDefinition.prototype.sanitizeToken = function (token) {
        var regexp = /([^a-z0-9])/gi;
        token = token ? token.replace(regexp, '') : '';
        return token;
    }
    StaticWebDefinition.prototype.encodeToHtml = function (data) {
        var toHtmlCode = function (char) { return '&#' + char.charCodeAt('0') + ';'; };
        return data.replace(/([^a-z0-9!{}<>/\;&#\:\ \=\\r\\n\\t\"\'\%\*\-\.\,\(\)\@])/gi, toHtmlCode);
    }
    StaticWebDefinition.prototype.getToken = function () {
        // We are hardcoded to support 'dropbox' and 'github' here as we us the 'token' key used by them.
        // TODO: fix this so it has pure cross provider support.
        var token = localStorage.getItem('token');
        return this.sanitizeToken(token);
    }

    w.StaticWebDefinition = StaticWebDefinition;
    w.StaticWeb = StaticWebDefinition();
})(window);
