(function (staticWeb, undefined) {
    "use strict";
    var NavNode = function (path, parentElementOrNode, template) {
        if (!(this instanceof NavNode)) {
            return new NavNode(path, parentElementOrNode, template);
        }
        return this.init(path, parentElementOrNode, template);
    }
    NavNode.prototype = {
        init: function (path, parentElementOrNode, template) {
            var self = this;

            this._path = false;
            this._displayName = false;
            this._children = [];
            this._hasRequestedChildren = false;
            this._parent = false;
            this._parentElement = false;
            this._element = false;
            this._template = template;
            this._childrenContainer = false;

            this.setPath(path);
            this.setDisplayName(path);

            if (parentElementOrNode instanceof NavNode) {
                this._parent = parentElementOrNode;

                var parentElement = this._parent.getChildrenContainer();
                this._parentElement = parentElement;
            } else {
                this._parentElement = parentElementOrNode;
            }

            var swItemTemplate = template.querySelector('sw-item');
            var li = swItemTemplate.children[0].cloneNode(true);

            li.setAttribute('title', self.getDisplayName());
            li.setAttribute('data-sw-nav-item-path', self.getPath());

            var link = li.querySelector('.sw-onpage-navigation-item-link');
            link.href = self.getPath();
            link.innerText = self.getDisplayName();

            var delLink = li.querySelector('.sw-onpage-navigation-item-delete');
            var addLink = li.querySelector('.sw-onpage-navigation-item-add');

            var showRemoveBtn = true;
            var showAddBtn = true;

            // We are not allowed to remove root page, so remove delete button
            if (this.getPath() === "/") {
                showRemoveBtn = false;
            }

            // Don't allow change in admin path (and ignore root)
            if (this.getPath().indexOf(staticWeb.getAdminPath()) >= 0) {
                showAddBtn = false;
                showRemoveBtn = false;
            }

            if (!showRemoveBtn) {
                delLink.remove();
            }

            if (!showAddBtn) {
                addLink.remove();
            }

            addLink.addEventListener('click', function (e) {
                self._showAddPageDialog();
            });
            delLink.addEventListener('click', function (e) {
                var hasChildren = self._children.length > 0;
                var msg = '';
                if (hasChildren) {
                    msg = 'Are you sure you want to remove ' + self.getDisplayName() + ' and all children?';
                }else {
                    msg = 'Are you sure you want to remove ' + self.getDisplayName() + '?';
                }
                if (confirm(msg)) {
                    staticWeb.storage.del(self.getPath() + '/', function (callStatus, path) {
                        if (callStatus.isOK) {
                            var isCurrentPagePartOfDeletedPath = location.pathname.indexOf(path) >= 0;

                            if (isCurrentPagePartOfDeletedPath) {
                                // we need to send user upwards in tree as current page has been removed.
                                var loc = location.pathname.replace('index.html', '').replace('index.htm', '');
                                var lastChar = loc[loc.length -1];
                                if (lastChar !== '/') {
                                    loc = loc + '/';
                                }
                                var index = loc.lastIndexOf('/',loc.length -2);
                                loc = loc.substring(0, index + 1);
                                // do the actual move to parent page
                                location.pathname = loc;
                            }else{
                                // reload page or update places that show page tree
                                location.reload();
                            }
                        }else{
                            alert('Unable to delete ' + path);
                        }
                    });
                }
            });

            this._element = li;
        },
        _showAddPageDialog: function () {
            var self = this;

            var body = document.querySelector('body');
            var attributes = {
                'data-staticweb-component-navnode-path': this.getPath()
            };
            staticWeb.initComponent(body, 'sw-onpage-page-create-dialog', attributes);
        },
        getChildrenContainer: function () {
            var self = this;
            if (!self._childrenContainer) {
                var element = self._element;
                var rootTemplate = self._template.querySelector('sw-root');
                var ulList = rootTemplate.children[0].cloneNode(true);

                var placeholder = element.querySelector('sw-item-children-placeholder');
                var parent = placeholder.parentNode;
                parent.replaceChild(ulList, placeholder);
                self._childrenContainer = ulList;
            }
            return self._childrenContainer;
        },
        getElement: function () {
            return this._element;
        },
        getParent: function () {
            return this._parent;
        },
        getPath: function () {
            return this._path;
        },
        setPath: function (path) {
            // remove index.html from path
            var path = path.toLowerCase().replace('/index.html', '');
            // Ensure that last char is slash
            if (path.length > 0 && path[path.length - 1] !== '/') {
                path = path + '/';
            }
            // dont allow empty path (Assume root node)
            if (path === '') {
                path = '/';
            }
            this._path = path;
        },
        getDisplayName: function () {
            return this._displayName;
        },
        setDisplayName: function (path) {
            if (!path) {
                return;
            }

            // remove index.html from path
            var name = path.toLowerCase().replace('/index.html', '');
            // remove ending slash
            if (name.length > 0 && name[name.length - 1] === '/') {
                name = name.substring(0, name.length - 1);
            }

            // get last folder name
            var tmp = name.split('/');
            name = tmp[tmp.length - 1];

            // If name is empty, we will asume it is root
            if (name === '') {
                name = '/';
            }

            // Make sure we have Title case on display name
            if (name && name.length > 0) {
                name = name.substring(0, 1).toUpperCase() + name.substring(1);
            }

            this._displayName = name;
        },
        getChildren: function (callback) {
            var self = this;
            // We have already ensured we have all children, return them
            if (this._hasRequestedChildren) {
                callback(self._children);
                return;
            }

            // TODO: Show spinner for current node

            staticWeb.storage.list(self.getPath(), function (list, callStatus) {
                if (callStatus.isOK) {
                    for (var i = 0; i < list.length; i++) {
                        // We assume that paths with '.' are files and everthing else are folders.
                        // FIX: Waiting for freightCrane issue #23 to help us
                        if (list[i].path.indexOf('.') === -1) {
                            // Ignore all paths in the ignore path settings
                            if (staticWeb.config.onPage.navigation.ignorePaths.indexOf(list[i].name) !== -1) {
                                continue;
                            }

                            var child = new NavNode(list[i].path, self, self._template);
                            self._children.push(child);
                        }
                    }
                    // sort navnodes by display name
                    self._children.sort(self.sortBy);

                    // add children to dom.
                    for (var i = 0; i < self._children.length; i++) {
                        var container = self.getChildrenContainer();
                        container.appendChild(self._children[i].getElement());
                    }

                    self._hasRequestedChildren = true;
                } else if (callStatus.code === 404) {
                    self._hasRequestedChildren = true;
                }

                // TODO: remove spinner for current node

                callback(self._children);
            });
        },
        sortBy: function (a, b) {
            var aPath = a.getDisplayName().toLowerCase();
            var bPath = b.getDisplayName().toLowerCase();

            if (aPath < bPath) {
                return -1;
            }
            if (aPath > bPath) {
                return 1;
            }
            return 0;
        }
    }

    var Options = function (element) {
        if (!(this instanceof Options)) {
            return new Options(element);
        }

        return this.init(element);
    }
    Options.prototype = {
        createInterface: function () {
            var self = this;

            staticWeb.retrieveTemplate("sw-onpage-options-pages", function (template) {
                var rootTemplate = template.querySelector('sw-root');
                var ulList = rootTemplate.children[0].cloneNode(true);
                self._element.appendChild(ulList);

                var rootNode = new NavNode('/', ulList, template);
                ulList.appendChild(rootNode.getElement());
                self.renderTree(rootNode);
            });
        },
        renderTree: function (node) {
            var self = this;
            // Should we call for more children
            node.getChildren(function (childNodes) {
                for (var i = 0; i < childNodes.length; i++) {
                    self.renderTree(childNodes[i]);
                }
            });
        },
        init: function (element) {
            var self = this;
            self._element = element;
            self.createInterface();
        }
    }
    staticWeb.registerComponent('sw-onpage-options-pages', Options);
})(window.StaticWeb);