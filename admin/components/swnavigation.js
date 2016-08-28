function changeNavigation(storage) {
    var nav = document.createElement('div');

    nav.style.position = 'fixed';
    nav.style.top = '0px';
    nav.style.margin = '0 auto';
    nav.style.width = '100%';
    nav.style.zIndex = '100000';

    var dragdown = document.createElement('div');
    dragdown.innerText = '+';
    dragdown.style.cursor = 'pointer';
    dragdown.style.border = 'solid 1px lightgrey';
    dragdown.style.borderTop = '0px';
    dragdown.style.width = '1em';
    dragdown.style.padding = '5px';
    dragdown.style.fontWeight = 'bold';
    dragdown.style.backgroundColor = '#2F5575';
    dragdown.style.color = '#fff';
    dragdown.style.borderRadius = '0 0 6px 0';
    nav.appendChild(dragdown);
    document.getElementsByTagName('body')[0].appendChild(nav);

    dragdown.addEventListener('click', function (event) {
        event.preventDefault();
        if (event.target.tagName.toLowerCase() != 'img') {
            dragdown.style.backgroundColor = '#fff'; // ff2200
            dragdown.style.color = '#000'; // ff2200
            dragdown.style.cursor = 'auto';
            this.innerHTML = "<span>loading page templates...</span>";
            dragdown.style.width = 'auto';
            dragdown.style.textAlign = 'left';
            var container = this;
            storage.list('/admin/templates/page/', function (info, status) {
                if (status.isOK) {
                    nav.style.position = 'absolute';
                    nav.style.top = '0px';

                    var list = arguments[0];
                    var elements = [];
                    elements.push('<b style="display:block;padding:5px;padding-bottom:10px">Create page from:</b>');
                    //elements.push('<ul>');
                    for (var i = 0; i < list.length; i++) {
                        var isPreview = list[i].path.indexOf('.jpg') > 0 || list[i].path.indexOf('.jpeg') > 0 || list[i].path.indexOf('.png') > 0 || list[i].path.indexOf('.gif') > 0;
                        if (isPreview) {
                            var name = list[i].name.replace('.jpg', '').replace('.jpeg', '').replace('.png', '').replace('.gif', '');
                            elements.push('<div style="margin:5px;padding:1px;width:250px;display:inline-block;background-color:#2F5575;color:#fff;vertical-align:top;border-radius:6px;"><b style="display:block;padding:4px">' + name + '</b><img src="' + list[i].path + '" width="100%" style="cursor:pointer" /></div>');

                        }
                    }
                    //elements.push('</ul>');
                    container.innerHTML = elements.join('');
                }
            });
        } else {
            dragdown.innerText = '+';
            dragdown.style.cursor = 'pointer';
            dragdown.style.border = 'solid 1px lightgrey';
            dragdown.style.borderTop = '0px';
            dragdown.style.width = '1em';
            dragdown.style.padding = '5px';
            dragdown.style.fontWeight = 'bold';
            dragdown.style.backgroundColor = '#2F5575';
            dragdown.style.color = '#fff';
            dragdown.style.borderRadius = '0 0 6px 0';

        }

    });
}