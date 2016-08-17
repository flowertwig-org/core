/* global jStorage */
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
        this.elements = {};
        this.permissionTypes = ['visitor'];

        this.storage = false;

        // Do we have a valid token?
        if (this.hasLoggedInInfo()) {
            this.loadLoggedInState();
        }
        else {
            var link = document.getElementById('staticweb-login-link');
            link.addEventListener('click', function (evt) {
                evt.preventDefault();

                var tmpState = 'staticweb-ts-' + new Date().getTime();
                window.localStorage.setItem('jStorage.github.tokenState', tmpState);
                window.location.assign(link.href.replace('stateKeyToVerifyToken', tmpState));
            });
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

        // load components that doesn't require permissions except 'visitor'
        this.loadComponents(true);

        this.includeScript(adminPath + 'js/jStorage.js');
        this.includeScript(adminPath + 'js/swconfig.js');
        self.ensureLoaded('storage', self.config, function () {
            // We have now loaded the StaticWeb config.

            // If we should check permission, default to visitor until we know.
            // if (self.config.permissions.check) {
            //     self.permissionType = 'visitor';
            // }

            self.ensureLoaded('jStorage', window, function () {
                self.includeScript(adminPath + 'js/jStorage.' + self.config.storage.type + '.js');
                self.ensureLoaded(self.config.storage.type, jStorage.providers, function () {
                    var jStorageConf = self.config.storage;
                    jStorageConf.name = jStorageConf.type;
                    jStorageConf.callback = function (storage, callStatus) {
                        if (self.config.permissions.check) {
                            self.checkPermissions(storage, self.notifyComponentsOfStorageReady);
                        } else {
                            self.notifyComponentsOfStorageReady(storage, self.permissionTypes);
                        }
                    };
                    self.storage = jStorage(jStorageConf);
                });
            });
        });
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

        if (!self.config.permissions || permissions.indexOf('admin') >= 0) {
        	self.loadAdminState(permissions);
        }
        
        var list = self.components;
        for (var compName in list) {
            var component = list[compName];
            if ('onStorageReady' in component) {
                component.onStorageReady(storage, permissions);
            }
        }
    }
    StaticWebDefinition.prototype.loadAdminState = function (loggedIn) {
        var self = this;
        var adminPath = this.getAdminPath();
        // this.loadComponents();

        if (loggedIn) {
            this.includeStyle(adminPath + 'css/swadmin.css');
            if (self.inAdminPath()) {
                self.showNavigation();
                self.removeLogin();
            }
            self.loadOnPage();
            self.config.storage.isReady = true;
        } else {
            alert('Ogiltigt personligt åtkomsttoken.');
            // token from jStorage seems invalid, remove it and reload page.
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
    StaticWebDefinition.prototype.loadOnPage = function () {
        var self = this;
        var adminPath = self.getAdminPath();

        if (this.config.onPage && this.config.onPage.display !== 'no') {
            this.includeScript(adminPath + 'js/swonpage.js');
        }
    }
    StaticWebDefinition.prototype.loadComponents = function (checkPermission) {
        var self = this;
        var adminPath = self.getAdminPath();

        // Find elements that should be created as components
        var elements = document.getElementsByClassName('staticweb-component');
        for (var index = 0; index < elements.length; index++) {
            var element = elements[index];

            if (checkPermission) {
                var componentPermissionType = 'admin';

                // check if component have set required permission type
                var componentPermRequireAttr = element.attributes['data-staticweb-perm-type'];
                if (componentPermRequireAttr) {
                    componentPermissionType = componentPermRequireAttr.value;
                }

                // If component required permission isnt available, ignore it. BUT if it has specified 'visitor', automatically approve it.
                if (componentPermissionType === 'visitor' || !self.permissionTypes.indexOf(componentPermissionType)) {
                    continue;
                }
            }

            var componentIdAttr = element.attributes['data-staticweb-component'];
            if (componentIdAttr) {
                // If this is the first component of this type, create array
                if (!self.elements[componentIdAttr.value]) {
                    self.elements[componentIdAttr.value] = [];
                }
                // add element to known elements for type
                self.elements[componentIdAttr.value].push(element);
            }
        }

        // Load all components we have found
        // We are waiting until we have gone through all elements because there can be multiple elements of same component type
        // and we want to be sure self.elements contains all of our types when component is loaded )
        for (var key in self.elements) {
            if (self.elements.hasOwnProperty(key)) {
                self.includeScript(adminPath + 'js/components/' + key + '.js');
            }
        }
    }
    StaticWebDefinition.prototype.writeCookie = function (name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toGMTString();
        }
        document.cookie = name + "=" + value + expires + "; path=/";
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

    StaticWebDefinition.prototype.showNavigation = function () {
        var nav = document.getElementsByClassName('navigation')[0];
        nav.style.display = "block";
    }

    StaticWebDefinition.prototype.removeLogin = function () {
        var mood = document.getElementsByClassName('mood')[0];
        mood.className = "mood";

        var callToAction = document.getElementsByClassName('call-to-action')[0];
        if (callToAction) {
            callToAction.remove();
        }
    }

    w.StaticWebDefinition = StaticWebDefinition;
    w.StaticWeb = StaticWebDefinition();
})(window);
