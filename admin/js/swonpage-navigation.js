/* global StaticWeb */
(function (sw) {

    var navigation = [];
    var locations = [];

    function getLocations() {
        var locationArray = location.pathname.split('/');
        // remove empty items
        var index = 0;
        while (locationArray.length > index) {
            if (locationArray[index] == "") {
                locationArray.splice(index, 1);
            }
            else {
                index++;
            }
        }

        var locations = [];
        while (locationArray.length) {
            var url = '/' + locationArray.join('/');
            if (url[url.length - 1] !== '/') {
                url = url + '/';
            }

            locations.push(url);
            locationArray.splice(locationArray.length - 1, 1);
        }
        locations.push('/');
        locations.reverse();

        return locations;
    }

    function getPath(name) {
        var name = name.replace('/index.html', '');
        if (name.length > 0 && name[name.length - 1] !== '/') {
            name = name + '/';
        }
        if (name === '') {
            name = '/';
        }
        return name;
    }

    function getDisplayName(name) {
        var name = name.replace('/index.html', '');
        if (name.length > 0 && name[name.length - 1] === '/') {
            name = name.substring(0, name.length - 1);
        }

        var tmp = name.split('/');
        name = tmp[tmp.length - 1];

        if (name === '') {
            name = '/';
        }

        return name;
    }

    function createNode(item, depth) {
        if (!sw.inAdminPath() && sw.config.onPage.navigation.ignorePaths.indexOf(item.link) !== -1) {
            return '';
        }

        var hasDepth = depth > 0;

        var displayName = item.name;
        while (depth) {
            displayName = "&nbsp;&nbsp;" + displayName;
            depth--;
        }

        if (item.isSelected && hasDepth) {
            displayName = displayName.replace("&nbsp;", "");
        }

        var file = '<li class="' + (item.isSelected ? 'sw-onpage-navigation-item-selected' : '') + '" title="' + item.name + '" data-sw-nav-item-path="' + item.path + '" data-sw-nav-item-folder="' + item.path + '" data-sw-nav-item-type="file"><span>';
        file += '<a href="' + item.link + '" class="sw-onpage-navigation-item-link">' + displayName + '</a>';
        if (item.isSelected) {
            file += '<a href="#" title="Delete ' + displayName + '" class="sw-onpage-navigation-item-delete">x</a>';
            file += '<a href="#" title="Add a sub-page for ' + displayName + '" class="sw-onpage-navigation-item-add">+</a>';
        }
        file += '</li>';
        var index = 0;
        while (item.children.length > index) {
            file += createNode(item.children[index], depth + 1);
            index++;
        }

        return file;
    }

    function sortItems(a, b) {
        var aPath = a.path; // getPath(a.path);
        var bPath = b.path; // getPath(b.path);

        if (aPath < bPath) {
            return -1;
        }
        if (aPath > bPath) {
            return 1;
        }
        return 0;
    }

    function createNodeWithItems(list) {
        var node = document.createElement("ul");
        node.className = 'sw-onpage-navigation-items';

        // Sort items
        list.sort(sortItems);

        // Remove duplicates
        var index = 0;
        var prevNodePath = false;
        while (list.length > index) {
            var tmpPath = list[index].path;
            if (prevNodePath === tmpPath) {
                list.splice(index, 1);
            } else {
                index++;
            }
            prevNodePath = tmpPath;
        }

        var files = '';
        var folders = '';
        var depth = 0;
        var prevItemPath = false;
        for (var index = 0; index < list.length; index++) {
            var item = list[index];
            if (prevItemPath !== item.path) {
                files += createNode(item, item.depth);
            }
        }

        node.innerHTML = folders + files;
        return node;
    }

    function showCreatePageDialog(addr, folder) {
        var dialog = document.createElement('div');
        dialog.className = 'sw-dialog';
        var dialogHeader = document.createElement('div');
        dialogHeader.className = 'sw-onpage-options-header';
        dialogHeader.innerHTML = 'StaticWeb - Create new page<a href="#" title="Close dialog" class="sw-onpage-navigation-item-close">x</a>';
        dialog.appendChild(dialogHeader);

        var dialogContent = document.createElement('div');
        dialogContent.className = 'sw-dialog-content';
        dialog.appendChild(dialogContent);

        var pageNameElement = document.createElement('div');
        pageNameElement.innerHTML = '<b style="display:block;padding:5px;padding-bottom:10px">Page name:</b><input id="sw-onpage-createpage-parent" type="hidden" value="' + folder + '" /><input id="sw-onpage-createpage-name" type="text" style="font-size:20px" />';
        dialogContent.appendChild(pageNameElement);

        var templates = document.createElement('div');
        templates.innerHTML = '<b style="display:block;padding:5px;padding-bottom:10px;padding-top:30px">Choose template to use:</b>loading page templates...';
        dialogContent.appendChild(templates);

        document.getElementsByTagName('body')[0].appendChild(dialog);

        var adminPath = sw.getAdminPath().replace(location.protocol + '//' + location.host, '');
        sw.storage.list(adminPath + 'templates/page/', function (info, status) {
            if (status.isOK) {
                var list = arguments[0];
                var elements = [];
                elements.push('<b style="display:block;padding:5px;padding-bottom:10px;padding-top:30px">Choose template to use:</b>');
                for (var i = 0; i < list.length; i++) {
                    var isPreview = list[i].path.indexOf('.jpg') > 0 || list[i].path.indexOf('.jpeg') > 0 || list[i].path.indexOf('.png') > 0 || list[i].path.indexOf('.gif') > 0;
                    if (isPreview) {
                        var name = list[i].name.replace('.jpg', '').replace('.jpeg', '').replace('.png', '').replace('.gif', '');
                        var path = list[i].path.replace('.jpg', '').replace('.jpeg', '').replace('.png', '').replace('.gif', '') + '.html';
                        elements.push('<div class="sw-onpage-navigation-createpage-template" data-sw-onpage-createpage-template="' + path + '" style="margin:5px;padding:1px;width:250px;display:inline-block;background-color:#2F5575;color:#fff;vertical-align:top;border-radius:6px;"><b style="display:block;padding:4px">' + name + '</b><img src="' + list[i].path + '" width="100%" style="cursor:pointer" /></div>');

                    }
                }
                templates.innerHTML = elements.join('');
                templates.addEventListener('click', function (e) {
                    var el = e.target.parentNode;
                    if (el.classList.contains('sw-onpage-navigation-createpage-template')) {
                        var inputName = document.getElementById('sw-onpage-createpage-name');
                        var inputFolder = document.getElementById('sw-onpage-createpage-parent');
                        var pageName = inputFolder.value + inputName.value + '/index.html';
                        var templateLocation = el.getAttribute('data-sw-onpage-createpage-template');
                        var resultAddress = getPath(pageName);
                        sw.addPage(pageName, templateLocation, function () {
                            dialogContent.innerHTML = "waiting for servers to empty cache, please wait";
                            waitUntilReady(resultAddress);
                        });
                    }
                });
            }
        });
    }

    function waitUntilReady(addr) {
        var iframe = document.createElement('iframe');
        var timeout = setTimeout(function () {
            // Clean up iframe
            try {
                iframe.parentElement.removeChild(iframe);
            } catch (error) {
                // do nothing, it is not that critical
            }
            // Do a new try
            waitUntilReady(addr);
            //location.assign(getPath(pageName)); // change location to parent
        }, 1000);
        iframe.onload = function () {
            var scripts = iframe.contentDocument.scripts;
            var hasValidScript = false;
            var test = sw.getAdminPath();

            for (var i = 0; i < scripts.length; i++) {
                if (document.scripts[i].src.indexOf(test)) {
                    hasValidScript = true;
                    break;
                }
            }
            //console.log('test:', hasValidScript);
            if (hasValidScript) {
                clearTimeout(timeout);
                // Clean up iframe
                iframe.parentElement.remove(iframe);
                location.assign(addr); // change location to parent
            }
        };
        iframe.src = addr + "?nocache=" + new Date().getTime();
        document.body.appendChild(iframe);
    }

    function createItem(item) {
        if (!sw.inAdminPath() && sw.config.onPage.navigation.ignorePaths.indexOf(item.name) !== -1) {
            return false;
        }

        var displayName = getDisplayName(item.path);
        var link = displayName;
        var path = getPath(item.path);
        var locationPath = getPath(location.pathname);
        var isSelected = (locationPath === path);

        return {
            'name': displayName,
            'link': item.path,
            'path': path,
            'children': [],
            'depth': path.split('/').length - 1,
            'isSelected': isSelected
        }
    }

    function getNavigationNodes(path, itemElement, headerElement, contentElement) {
        sw.storage.list(path, function (list, callStatus) {
            if (callStatus.isOK) {
                for (var i = 0; i < list.length; i++) {
                    var item = createItem(list[i]);
                    if (item) {
                        navigation.push(item);
                    }
                }

                showNavigation(navigation, itemElement, headerElement, contentElement);
            }
        });
    }


    function showNavigation(navigation, navigationNode, navigationHeaderNode, navigationListNode) {
        var node = createNodeWithItems(navigation);
        navigationListNode.innerHTML = '';
        navigationListNode.appendChild(node);

        node.addEventListener('click', function (e) {
            if (e.target.classList.contains('sw-onpage-navigation-item-add')) {
                var addr = e.target.parentNode.parentNode.getAttribute('data-sw-nav-item-path');
                var folder = e.target.parentNode.parentNode.getAttribute('data-sw-nav-item-folder');

                showCreatePageDialog(addr, folder);
            }
            else if (e.target.classList.contains('sw-onpage-navigation-item-delete')) {
                var addr = e.target.parentNode.parentNode.getAttribute('data-sw-nav-item-path');
                if (confirm('Are you sure you want to delete "' + addr + '"?')) {
                    sw.storage.del(addr + 'index.html', function (status) {
                        if (status.isOK) {
                            console.log('successfully deleted page', addr);

                            var tmp = getPath(addr);
                            var arr = tmp.split('/');
                            while (arr.pop() === '') {
                                // Remove all empty items in the back.
                            }
                            arr.pop(); // remove page
                            tmp = arr.join('/');
                            if (tmp == '') {
                                tmp = '/';
                            }
                            location.assign(tmp); // change location to parent
                        }
                    })
                }
            }
        });

        navigationNode.setAttribute('data-sw-nav-expandable', '1');
        navigationHeaderNode.style.paddingBottom = '5px';
        navigationHeaderNode.style.borderBottom = 'solid 3px rgb(47, 85, 117)';
    }

    var itemElement = document.getElementsByClassName('sw-onpage-navigation-item')[0];
    var headerElement = itemElement.getElementsByClassName('sw-onpage-options-item-header')[0];
    var contentElement = itemElement.getElementsByClassName('sw-onpage-options-item-content')[0];


    locations = getLocations();
    for (var i = 0; i < locations.length; i++) {
        getNavigationNodes(locations[i], itemElement, headerElement, contentElement);
    }

})(StaticWeb);