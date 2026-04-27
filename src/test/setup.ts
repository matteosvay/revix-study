// Only import DOM matchers and mock browser APIs when running in jsdom environment.
if (typeof window !== "undefined") {
  // @ts-ignore - side-effect import for matchers, no type module exported
  import("@testing-library/jest-dom/vitest");

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });
}
