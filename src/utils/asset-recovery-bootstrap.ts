declare global {
  interface Window {
    __sorterAssetRecovery?: {
      recover?: (error: unknown) => Promise<boolean>;
      reload: () => boolean;
      showUnavailable?: (unsaved?: boolean) => void;
    };
  }
}

export function bootstrapAssetRecovery(build: string) {
  if (window.__sorterAssetRecovery) return;

  const state = {
    recover: undefined as ((error: unknown) => Promise<boolean>) | undefined,
    showUnavailable: (unsaved = false) => {
      const url = new URL(window.location.href);
      url.searchParams.delete('__sorter_reload');
      const show = () => {
        if (document.getElementById('sorter-update-error')) return;
        const notice = document.createElement('div');
        notice.id = 'sorter-update-error';
        notice.setAttribute('role', 'alert');
        notice.style.cssText =
          'position:fixed;inset:0 0 auto;z-index:2147483647;padding:16px;background:#fff;color:#111;font:16px system-ui';
        if (unsaved) {
          notice.append(
            'Some app files could not be loaded. Some changes are only in this tab. Export your sessions before reloading.'
          );
        } else {
          notice.append('Some app files could not be loaded. Check your connection, then ');
          const link = document.createElement('a');
          link.href = url.href;
          link.textContent = 'reload this page';
          notice.append(link, '. Your browser data has not been cleared.');
        }
        document.body.append(notice);
      };
      if (document.body) show();
      else document.addEventListener('DOMContentLoaded', show, { once: true });
    },
    reload: () => {
      const url = new URL(window.location.href);
      url.searchParams.delete('__sorter_reload');
      const key = `${build}:${url.pathname}${url.search}`;
      try {
        if (sessionStorage.getItem('sorter-asset-recovery') === key) {
          state.showUnavailable();
          return false;
        }
        sessionStorage.setItem('sorter-asset-recovery', key);
      } catch {
        state.showUnavailable();
        return false;
      }
      url.searchParams.set('__sorter_reload', String(Date.now()));
      window.location.replace(url.href);
      return true;
    }
  };
  window.__sorterAssetRecovery = state;

  const recover = (error: unknown) => {
    if (
      !(error instanceof Error) ||
      !/Failed to fetch dynamically imported module|Importing a module script failed|Failed to load module script|error loading dynamically imported module|Unable to preload CSS/i.test(
        error.message
      )
    ) {
      return;
    }
    if (state.recover) void state.recover(error);
    else state.reload();
  };

  window.addEventListener('vite:preloadError', (event) => {
    recover((event as Event & { payload: unknown }).payload);
  });
  window.addEventListener('unhandledrejection', (event) => recover(event.reason));
  window.addEventListener(
    'error',
    (event) => {
      const target = event.target;
      const source =
        target instanceof HTMLScriptElement && target.type === 'module'
          ? target.src
          : target instanceof HTMLLinkElement && target.rel === 'stylesheet'
            ? target.href
            : undefined;
      if (!source) return;
      const url = new URL(source, window.location.href);
      if (url.origin !== window.location.origin || !url.pathname.includes('/assets/')) return;
      recover(
        new Error(
          target instanceof HTMLLinkElement
            ? `Unable to preload CSS for ${url.href}`
            : `Failed to load module script: ${url.href}`
        )
      );
    },
    true
  );
  window.addEventListener(
    'load',
    () => {
      for (const link of document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')) {
        const url = new URL(link.href, window.location.href);
        if (
          !link.sheet &&
          url.origin === window.location.origin &&
          url.pathname.includes('/assets/')
        ) {
          recover(new Error(`Unable to preload CSS for ${url.href}`));
        }
      }
    },
    { once: true }
  );
}

export const getAssetRecoveryScript = (build: string) =>
  `(${bootstrapAssetRecovery.toString()})(${JSON.stringify(build)});`;
