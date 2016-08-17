/* global StaticWeb */
(function (sw) {
    function getOnPage() {
        var key = "sw.config.onPage.display";
        var value = sw.getSetting(key);
        return value;
    }

    function updateOnPage(onPageDisplay) {
        if (onPageDisplay) {
            sw.setSetting('sw.config.onPage.display', onPageDisplay);
            if (onPageDisplay === "onDemand") {
                updateNavigation("onDemand");
            }
        }
    }

    function getNavigation() {
        var key = "sw.config.onPage.navigation.display";
        var value = sw.getSetting(key);
        return value;
    }

    function updateNavigation(onPageNavigationDisplay) {
        if (onPageNavigationDisplay) {
            sw.setSetting('sw.config.onPage.navigation.display', onPageNavigationDisplay);
        }
    }

    function toggleOnPage(dragdown) {
        if (document.body.classList.toggle('sw-onpage-options-show')) {
            dragdown.innerText = '-';
            updateOnPage("always");
        } else {
            dragdown.innerText = '+';
            updateOnPage("onDemand");
        }
    }

    function toggleNavigationItems(navigation, navigationHeader, navigationList) {
        if (navigation.hasAttribute('data-sw-nav-expandable')) {
            var isHidden = navigationList.style.display === 'none';
            if (isHidden) {
                updateNavigation("always");
                navigationList.style.display = 'block';
                navigationHeader.style.paddingBottom = '5px';
                navigationHeader.style.borderBottom = 'solid 3px rgb(47, 85, 117)';
            } else {
                updateNavigation("onDemand");
                navigationList.style.display = 'none';
                navigationHeader.style.paddingBottom = '0';
                navigationHeader.style.borderBottom = '0';
            }
        } else {
            updateNavigation("always");

            // Including navigation script
            var adminPath = sw.getAdminPath();
            sw.includeScript(adminPath + 'js/swonpage-navigation.js');
        }
    }

    var adminPath = sw.getAdminPath();

    var nav = document.createElement('div');
    nav.className = 'sw-onpage-options';
    var header = document.createElement('div');
    header.className = 'sw-onpage-options-header';
    header.innerText = 'StaticWeb';
    nav.appendChild(header);

    var dragdown = document.createElement('div');
    dragdown.className = 'sw-dragdown';
    dragdown.addEventListener('click', function (event) {
        toggleOnPage(dragdown);
    });

    nav.appendChild(dragdown);

    var options = document.createElement('ul');
    options.className = 'sw-onpage-options-items';

    /*
        # Navigation
        # Pending Changes
        # Pages
    */
    var navigation = document.createElement('li');
    navigation.className = 'sw-onpage-options-item sw-onpage-navigation-item';
    var navigationHeader = document.createElement('div');
    navigationHeader.className = 'sw-onpage-options-item-header'
    navigationHeader.innerText = 'Navigation';
    var navigationList = document.createElement('div');
    navigationList.className = 'sw-onpage-options-item-content';

    navigationHeader.addEventListener('click', function (e) {
        toggleNavigationItems(navigation, navigationHeader, navigationList);
    });

    navigation.appendChild(navigationHeader);
    navigation.appendChild(navigationList);

    options.appendChild(navigation);
    nav.appendChild(options);

    var onPageDisplaySetting = getOnPage();
    var onNavigation = getNavigation();
    switch (onPageDisplaySetting) {
        case 'onDemand':
            dragdown.innerText = '+';
            break;
        case 'always':
            toggleOnPage(dragdown);
            break;
        default:
            break;
    }
    if (onNavigation === "always") {
        toggleNavigationItems(navigation, navigationHeader, navigationList);
    }

    document.getElementsByTagName('body')[0].appendChild(nav);
})(StaticWeb);