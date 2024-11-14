import { Url } from 'url';

export function isValidURL(url: string) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

export function filterUrls(links: string[], url: string) {
  const urlDomain = new URL(url).hostname;
  const filteredLinks = new Set(
    links
      .map((link) => {
        const urlObj = new URL(link);
        urlObj.hash = '';
        urlObj.search = '';
        return urlObj.toString();
      })
      .filter((link) => link.includes(urlDomain)),
  );

  return [...filteredLinks];
}
