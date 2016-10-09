<img src="https://staticwebcms.github.io/admin/img/logo.svg" width="300" alt="staticweb" aria-hidden="true" role="presentation" />

# The Gist
Static Web is not your daddys CMS. It's a CMS that is totally static. Which
means it's lightning fast in delivery. It differs from other static site
generators like jekyll in that it has a dynamic admin system like wordpress or
other web based CMS-systems.

Static Web is designed to be hosted either on Dropbox, Github or any other
non-localStorage storage provider supported by
https://github.com/freightCrane/freightCrane. The key importance in those storage
providers is the ability to have permissions and writing over an oAuth-based
API. Github have full feature support since they also have Github Pages which
allow the pages to be served on the internet.

# Installation
If you have a github account, setup takes roughly 2 minutes and is totally free.

Either use the online installer([TODO in issue #6](https://github.com/StaticWebCMS/core/issues/6)) or clone this repo into an
existing web server such as apache or nginx.

# Configuration Options
There's a lot of configuration options.

# Browser Support
We aim to be compatible with these browsers. However we do not actively test our
code in other browsers than Chrome, Firefox and sometimes IE/Edge. Bugs will be
only accepted if they fall within the below stated browser support range.

## Client Web Interface
- Should not need javascript out of the box.
- All browsers should be supported out of the box.

## Administration Web Interface
- Requires JS.
- IE 11 or greater.
- Edge/Safari/Firefox/Chrome `CurrentVersion - 1`.
- Opera 39 or later.
- Android Browser: NO.
- Chrome for Android: 52 or greater.
- Other: Latest, but not tested, will try to fix bugs.

# License
MIT License
