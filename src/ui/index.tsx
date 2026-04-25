import { render } from '@create-figma-plugin/ui';
import { App } from './App';

// Inject the HomeToGo wordmark on brand purple as the iframe favicon.
// Figma's published plugins set their thumbnail through the community
// page; for the dev build the manifest has no icon field, so pinning
// it here makes the icon show up in any debug surface (browser tabs
// when the iframe is inspected, future Figma versions that surface
// iframe favicons in the title bar).
function setPluginFavicon(): void {
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">' +
        '<rect width="64" height="64" rx="12" fill="#612ACE"/>' +
        '<text x="50%" y="56%" text-anchor="middle" dominant-baseline="middle" ' +
          'font-family="Inter, -apple-system, sans-serif" font-weight="800" ' +
          'font-size="22" fill="#FFFFFF" letter-spacing="-1">htg</text>' +
      '</svg>'
    );
  document.head.appendChild(link);
}

setPluginFavicon();

export default render(App);
