import assert from "node:assert/strict";
import test from "node:test";

import {
  bootstrapPublicationViewers,
  clampPage,
  clampScale,
  createViewerController,
} from "../assets/publication-viewer.js";

function createElement(overrides = {}) {
  const listeners = new Map();
  const attributes = new Map();
  return {
    hidden: false,
    disabled: false,
    textContent: "",
    style: {},
    clientWidth: 600,
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    removeEventListener(type, listener) {
      if (listeners.get(type) === listener) listeners.delete(type);
    },
    click() {
      listeners.get("click")?.({ currentTarget: this });
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
    getAttribute(name) {
      return attributes.get(name) ?? null;
    },
    replaceChildren() {
      this.textContent = "";
    },
    ...overrides,
  };
}

function createRoot({ locale = "en", textLayer = true } = {}) {
  const elements = {
    "[data-viewer-previous]": createElement(),
    "[data-viewer-next]": createElement(),
    "[data-viewer-zoom-out]": createElement(),
    "[data-viewer-zoom-in]": createElement(),
    "[data-viewer-fullscreen]": createElement(),
    "[data-viewer-page]": createElement(),
    "[data-viewer-pages]": createElement(),
    "[data-viewer-status]": createElement(),
    "[data-viewer-error]": createElement({ hidden: true }),
    "[data-viewer-stage]": createElement({ clientWidth: 600 }),
    "[data-viewer-page-container]": createElement(),
    "[data-pdf-text-layer]": createElement(),
    ".publication-viewer__toolbar": createElement(),
    "[data-pdf-canvas]": createElement({
      width: 0,
      height: 0,
      getContext: () => ({ canvasContext: true }),
    }),
  };
  const ownerDocument = {
    fullscreenElement: null,
    defaultView: { devicePixelRatio: 2 },
    exitFullscreenCalls: 0,
    async exitFullscreen() {
      this.exitFullscreenCalls += 1;
    },
  };
  const root = createElement({
    dataset: {
      previewUrl:
        "https://familyclinic-doctor-publications.nbg1.your-objectstorage.com/preview.pdf",
      previewPages: "3",
      previewLocale: locale,
      textLayer: String(textLayer),
    },
    ownerDocument,
    fullscreenCalls: 0,
    async requestFullscreen() {
      this.fullscreenCalls += 1;
    },
    querySelector(selector) {
      return elements[selector] ?? null;
    },
  });
  return { root, elements, ownerDocument };
}

function createObserverHarness() {
  const state = { callback: null, options: null, observed: 0, unobserved: 0, disconnected: 0 };
  const observe = (callback, options) => {
    state.callback = callback;
    state.options = options;
    return {
      observe() {
        state.observed += 1;
      },
      unobserve() {
        state.unobserved += 1;
      },
      disconnect() {
        state.disconnected += 1;
      },
    };
  };
  return { observe, state };
}

function createPdfjsFake({
  rejectLoad = false,
  manualRenders = false,
  rejectPageNumbers = [],
} = {}) {
  const state = {
    getDocumentCalls: 0,
    getPageCalls: [],
    loadingDestroyed: 0,
    documentDestroyed: 0,
    renderTasks: [],
    textLayers: [],
  };
  const document = {
    numPages: 3,
    async getPage(pageNumber) {
      state.getPageCalls.push(pageNumber);
      if (rejectPageNumbers.includes(pageNumber)) {
        throw new Error(`page ${pageNumber} failed`);
      }
      return {
        getViewport({ scale }) {
          return { width: 600 * scale, height: 800 * scale, scale };
        },
        render() {
          let resolve;
          let reject;
          const task = {
            cancelled: false,
            promise: manualRenders
              ? new Promise((resolvePromise, rejectPromise) => {
                  resolve = resolvePromise;
                  reject = rejectPromise;
                })
              : Promise.resolve(),
            resolve: () => resolve?.(),
            cancel() {
              this.cancelled = true;
              const error = new Error("cancelled");
              error.name = "RenderingCancelledException";
              reject?.(error);
            },
          };
          state.renderTasks.push(task);
          return task;
        },
        async getTextContent() {
          return { items: [{ str: "Preview" }] };
        },
      };
    },
    async destroy() {
      state.documentDestroyed += 1;
    },
  };
  const loadingTask = {
    promise: rejectLoad ? Promise.reject(new Error("load failed")) : Promise.resolve(document),
    async destroy() {
      state.loadingDestroyed += 1;
    },
  };

  class TextLayer {
    constructor(options) {
      this.options = options;
      state.textLayers.push(this);
    }

    async render() {}
  }

  return {
    pdfjs: {
      getDocument(input) {
        state.getDocumentCalls += 1;
        state.getDocumentInput = input;
        return loadingTask;
      },
      TextLayer,
    },
    state,
    loadingTask,
  };
}

const tick = () => new Promise((resolve) => setImmediate(resolve));

test("viewer page and scale values clamp at their supported bounds", () => {
  assert.equal(clampPage(-4, 8), 1);
  assert.equal(clampPage(20, 8), 8);
  assert.equal(clampPage(4, 8), 4);
  assert.equal(clampScale(0.1), 0.5);
  assert.equal(clampScale(4), 3);
  assert.equal(clampScale(1.25), 1.25);
});

test("intersection loads once and enables page controls after rendering", async () => {
  const { root, elements } = createRoot();
  const { observe, state: observer } = createObserverHarness();
  const { pdfjs, state } = createPdfjsFake();
  const controller = createViewerController({ root, pdfjs, observe });

  assert.equal(observer.options.rootMargin, "200px");
  observer.callback([{ isIntersecting: true }]);
  observer.callback([{ isIntersecting: true }]);
  await controller.load();

  assert.equal(state.getDocumentCalls, 1);
  assert.deepEqual(state.getDocumentInput, {
    url: root.dataset.previewUrl,
    disableFontFace: false,
  });
  assert.equal(observer.unobserved, 1);
  assert.equal(elements["[data-viewer-previous]"].disabled, true);
  assert.equal(elements["[data-viewer-next]"].disabled, false);
  assert.equal(elements["[data-viewer-fullscreen]"].disabled, false);
  assert.equal(elements["[data-viewer-page]"].textContent, "1");
  assert.equal(elements["[data-viewer-status]"].hidden, true);

  await controller.next();
  assert.equal(elements["[data-viewer-page]"].textContent, "2");
  await controller.next();
  assert.equal(elements["[data-viewer-next]"].disabled, true);
  await controller.next();
  assert.equal(elements["[data-viewer-page]"].textContent, "3");
  await controller.previous();
  assert.equal(elements["[data-viewer-page]"].textContent, "2");
});

test("Arabic previews use glyph paths instead of browser font faces", async () => {
  for (const [locale, disableFontFace] of [
    ["ar", true],
    ["en", false],
    ["fr", false],
  ]) {
    const { root } = createRoot({ locale });
    const { pdfjs, state } = createPdfjsFake();
    const controller = createViewerController({
      root,
      pdfjs,
      observe: createObserverHarness().observe,
    });

    await controller.load();

    assert.deepEqual(state.getDocumentInput, {
      url: root.dataset.previewUrl,
      disableFontFace,
    });
  }
});

test("new renders cancel stale work and zoom in quarter steps", async () => {
  const { root, elements } = createRoot();
  const harness = createPdfjsFake({ manualRenders: true });
  const controller = createViewerController({
    root,
    pdfjs: harness.pdfjs,
    observe: createObserverHarness().observe,
  });

  const load = controller.load();
  await tick();
  harness.state.renderTasks[0].resolve();
  await load;

  const first = controller.zoomIn();
  await tick();
  const second = controller.zoomIn();
  await tick();
  assert.equal(harness.state.renderTasks[1].cancelled, true);
  harness.state.renderTasks[2].resolve();
  await Promise.all([first, second]);
  assert.equal(controller.state.scale, 1.5);

  for (let index = 0; index < 8; index += 1) {
    const zoom = controller.zoomOut();
    await tick();
    harness.state.renderTasks.at(-1).resolve();
    await zoom;
  }
  assert.equal(controller.state.scale, 0.5);
  assert.equal(elements["[data-viewer-zoom-out]"].disabled, true);
});

test("load failures reveal the localized fallback without touching download UI", async () => {
  const { root, elements } = createRoot();
  const { pdfjs } = createPdfjsFake({ rejectLoad: true });
  const controller = createViewerController({
    root,
    pdfjs,
    observe: createObserverHarness().observe,
  });

  await assert.rejects(controller.load(), /load failed/);
  assert.equal(elements["[data-viewer-error]"].hidden, false);
  assert.equal(elements["[data-viewer-page-container]"].hidden, true);
  assert.equal(elements[".publication-viewer__toolbar"].hidden, true);
  assert.equal(elements["[data-viewer-status]"].hidden, true);
});

test("PDF.js module failures reveal the localized fallback", async () => {
  const { root, elements } = createRoot();

  const controllers = await bootstrapPublicationViewers({
    documentRoot: { querySelectorAll: () => [root] },
    loadPdfjsImpl: async () => {
      throw new Error("module failed");
    },
  });

  assert.deepEqual(controllers, []);
  assert.equal(elements["[data-viewer-error]"].hidden, false);
  assert.equal(elements["[data-viewer-page-container]"].hidden, true);
  assert.equal(elements[".publication-viewer__toolbar"].hidden, true);
  assert.equal(elements["[data-viewer-status]"].hidden, true);
});

test("navigation render failures reveal the localized fallback", async () => {
  const { root, elements } = createRoot();
  const { pdfjs } = createPdfjsFake({ rejectPageNumbers: [2] });
  const controller = createViewerController({
    root,
    pdfjs,
    observe: createObserverHarness().observe,
  });
  await controller.load();

  await assert.rejects(controller.next(), /page 2 failed/);
  assert.equal(elements["[data-viewer-error]"].hidden, false);
  assert.equal(elements["[data-viewer-page-container]"].hidden, true);
  assert.equal(elements[".publication-viewer__toolbar"].hidden, true);
  assert.equal(elements["[data-viewer-status]"].hidden, true);
});

test("an unavailable intersection observer falls back to eager loading", async () => {
  const { root, elements } = createRoot();
  const { pdfjs, state } = createPdfjsFake();
  const controller = createViewerController({
    root,
    pdfjs,
    observe: () => {
      throw new Error("observer unavailable");
    },
  });

  await controller.load();
  assert.equal(state.getDocumentCalls, 1);
  assert.equal(elements["[data-viewer-error]"].hidden, true);
  assert.equal(elements["[data-viewer-page-container]"].hidden, false);
});

test("text layers render only for editions marked suitable", async () => {
  for (const enabled of [true, false]) {
    const { root, elements } = createRoot({ textLayer: enabled });
    const { pdfjs, state } = createPdfjsFake();
    const controller = createViewerController({
      root,
      pdfjs,
      observe: createObserverHarness().observe,
    });
    await controller.load();

    assert.equal(state.textLayers.length, enabled ? 1 : 0);
    assert.equal(
      elements["[data-pdf-text-layer]"].getAttribute("aria-hidden"),
      enabled ? null : "true",
    );
  }
});

test("fullscreen toggles and destroy releases observer, render, loading, and PDF tasks", async () => {
  const { root, ownerDocument } = createRoot();
  const observer = createObserverHarness();
  const harness = createPdfjsFake({ manualRenders: true });
  const controller = createViewerController({
    root,
    pdfjs: harness.pdfjs,
    observe: observer.observe,
  });
  const load = controller.load();
  await tick();
  harness.state.renderTasks[0].resolve();
  await load;

  await controller.toggleFullscreen();
  assert.equal(root.fullscreenCalls, 1);
  ownerDocument.fullscreenElement = root;
  await controller.toggleFullscreen();
  assert.equal(ownerDocument.exitFullscreenCalls, 1);

  const pending = controller.zoomIn();
  await tick();
  await controller.destroy();
  await pending;
  assert.equal(harness.state.renderTasks.at(-1).cancelled, true);
  assert.equal(harness.state.loadingDestroyed, 1);
  assert.equal(harness.state.documentDestroyed, 1);
  assert.equal(observer.state.disconnected, 1);
});
