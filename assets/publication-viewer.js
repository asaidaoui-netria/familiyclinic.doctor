const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SCALE_STEP = 0.25;

export function clampPage(page, pageCount) {
  const count = Math.max(1, Number(pageCount) || 1);
  return Math.min(count, Math.max(1, Math.round(Number(page) || 1)));
}

export function clampScale(scale) {
  const numericScale = Number(scale) || 1;
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, numericScale));
}

function defaultObserve(callback, options) {
  return new IntersectionObserver(callback, options);
}

function requiredElement(root, selector) {
  const element = root.querySelector(selector);
  if (!element) throw new Error(`Publication viewer is missing ${selector}`);
  return element;
}

function isCancelledRender(error) {
  return error?.name === "RenderingCancelledException";
}

export function revealViewerFallback(root) {
  const status = root?.querySelector?.("[data-viewer-status]");
  const toolbar = root?.querySelector?.(".publication-viewer__toolbar");
  const pageContainer = root?.querySelector?.(
    "[data-viewer-page-container]",
  );
  const error = root?.querySelector?.("[data-viewer-error]");
  if (status) status.hidden = true;
  if (toolbar) toolbar.hidden = true;
  if (pageContainer) pageContainer.hidden = true;
  if (error) error.hidden = false;
}

export function createViewerController({
  root,
  pdfjs,
  observe = defaultObserve,
}) {
  if (!root || !pdfjs?.getDocument) {
    throw new Error("A viewer root and PDF.js implementation are required");
  }

  const elements = {
    previous: requiredElement(root, "[data-viewer-previous]"),
    next: requiredElement(root, "[data-viewer-next]"),
    zoomOut: requiredElement(root, "[data-viewer-zoom-out]"),
    zoomIn: requiredElement(root, "[data-viewer-zoom-in]"),
    fullscreen: requiredElement(root, "[data-viewer-fullscreen]"),
    currentPage: requiredElement(root, "[data-viewer-page]"),
    totalPages: requiredElement(root, "[data-viewer-pages]"),
    status: requiredElement(root, "[data-viewer-status]"),
    error: requiredElement(root, "[data-viewer-error]"),
    stage: requiredElement(root, "[data-viewer-stage]"),
    pageContainer: requiredElement(root, "[data-viewer-page-container]"),
    canvas: requiredElement(root, "[data-pdf-canvas]"),
    textLayer: requiredElement(root, "[data-pdf-text-layer]"),
    toolbar: requiredElement(root, ".publication-viewer__toolbar"),
  };
  const declaredPageCount = Number(root.dataset.previewPages);
  if (!Number.isInteger(declaredPageCount) || declaredPageCount < 1) {
    throw new Error("Publication preview page count is invalid");
  }

  const state = {
    page: 1,
    pageCount: declaredPageCount,
    scale: 1,
    loaded: false,
    destroyed: false,
  };
  let loadingTask;
  let pdfDocument;
  let renderTask;
  let loadPromise;
  let renderGeneration = 0;
  let intersectionHandled = false;

  function updateControls() {
    const ready = state.loaded && !state.destroyed;
    elements.previous.disabled = !ready || state.page <= 1;
    elements.next.disabled = !ready || state.page >= state.pageCount;
    elements.zoomOut.disabled = !ready || state.scale <= MIN_SCALE;
    elements.zoomIn.disabled = !ready || state.scale >= MAX_SCALE;
    elements.fullscreen.disabled =
      !ready || typeof root.requestFullscreen !== "function";
    elements.currentPage.textContent = String(state.page);
    elements.totalPages.textContent = String(state.pageCount);
  }

  function showFailure() {
    revealViewerFallback(root);
    state.loaded = false;
    updateControls();
  }

  async function renderTextLayer(page, viewport, generation) {
    elements.textLayer.replaceChildren();
    if (root.dataset.textLayer !== "true") {
      elements.textLayer.setAttribute("aria-hidden", "true");
      return;
    }

    elements.textLayer.removeAttribute("aria-hidden");
    try {
      const textContentSource = await page.getTextContent();
      if (generation !== renderGeneration || state.destroyed) return;
      const textLayer = new pdfjs.TextLayer({
        textContentSource,
        container: elements.textLayer,
        viewport,
      });
      await textLayer.render();
    } catch (_error) {
      elements.textLayer.replaceChildren();
      elements.textLayer.setAttribute("aria-hidden", "true");
    }
  }

  async function renderCurrentPage() {
    if (!pdfDocument || state.destroyed) return;
    const generation = ++renderGeneration;
    renderTask?.cancel();
    renderTask = undefined;

    const page = await pdfDocument.getPage(state.page);
    if (generation !== renderGeneration || state.destroyed) return;
    const baseViewport = page.getViewport({ scale: 1 });
    const availableWidth = elements.stage.clientWidth || baseViewport.width;
    const fitScale = availableWidth / baseViewport.width;
    const viewport = page.getViewport({ scale: fitScale * state.scale });
    const pixelRatio =
      root.ownerDocument?.defaultView?.devicePixelRatio || 1;
    const context = elements.canvas.getContext("2d", { alpha: false });
    elements.canvas.width = Math.floor(viewport.width * pixelRatio);
    elements.canvas.height = Math.floor(viewport.height * pixelRatio);
    elements.canvas.style.width = `${viewport.width}px`;
    elements.canvas.style.height = `${viewport.height}px`;

    const task = page.render({
      canvasContext: context,
      viewport,
      transform:
        pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
    });
    renderTask = task;
    try {
      await task.promise;
    } catch (error) {
      if (generation !== renderGeneration || isCancelledRender(error)) return;
      throw error;
    }
    if (generation !== renderGeneration || state.destroyed) return;
    renderTask = undefined;

    await renderTextLayer(page, viewport, generation);
    if (generation !== renderGeneration || state.destroyed) return;
    elements.status.hidden = true;
    elements.toolbar.hidden = false;
    elements.pageContainer.hidden = false;
    elements.error.hidden = true;
    updateControls();
  }

  async function load() {
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
      try {
        loadingTask = pdfjs.getDocument({ url: root.dataset.previewUrl });
        pdfDocument = await loadingTask.promise;
        if (state.destroyed) return;
        if (pdfDocument.numPages !== declaredPageCount) {
          throw new Error(
            `Preview page count mismatch: expected ${declaredPageCount}, received ${pdfDocument.numPages}`,
          );
        }
        state.pageCount = pdfDocument.numPages;
        state.loaded = true;
        await renderCurrentPage();
      } catch (error) {
        if (!state.destroyed) showFailure();
        throw error;
      }
    })();
    return loadPromise;
  }

  async function changePage(nextPage) {
    if (!state.loaded || state.destroyed) return;
    const page = clampPage(nextPage, state.pageCount);
    if (page === state.page) return;
    state.page = page;
    updateControls();
    try {
      return await renderCurrentPage();
    } catch (error) {
      if (!state.destroyed && !isCancelledRender(error)) showFailure();
      throw error;
    }
  }

  async function changeScale(nextScale) {
    if (!state.loaded || state.destroyed) return;
    const scale = clampScale(nextScale);
    if (scale === state.scale) return;
    state.scale = scale;
    updateControls();
    try {
      return await renderCurrentPage();
    } catch (error) {
      if (!state.destroyed && !isCancelledRender(error)) showFailure();
      throw error;
    }
  }

  const actions = {
    previous: () => changePage(state.page - 1),
    next: () => changePage(state.page + 1),
    zoomOut: () => changeScale(state.scale - SCALE_STEP),
    zoomIn: () => changeScale(state.scale + SCALE_STEP),
    async toggleFullscreen() {
      const ownerDocument = root.ownerDocument;
      if (ownerDocument?.fullscreenElement) {
        await ownerDocument.exitFullscreen?.();
      } else {
        await root.requestFullscreen?.();
      }
    },
  };
  const listeners = [
    [elements.previous, () => void actions.previous().catch(() => {})],
    [elements.next, () => void actions.next().catch(() => {})],
    [elements.zoomOut, () => void actions.zoomOut().catch(() => {})],
    [elements.zoomIn, () => void actions.zoomIn().catch(() => {})],
    [
      elements.fullscreen,
      () => void actions.toggleFullscreen().catch(() => {}),
    ],
  ];
  for (const [element, listener] of listeners) {
    element.addEventListener("click", listener);
  }

  let observer = {
    disconnect() {},
    unobserve() {},
  };
  try {
    observer = observe(
      (entries) => {
        if (
          intersectionHandled ||
          !entries.some(({ isIntersecting }) => isIntersecting)
        ) {
          return;
        }
        intersectionHandled = true;
        observer.unobserve(root);
        void load().catch(() => {});
      },
      { rootMargin: "200px" },
    );
    observer.observe(root);
  } catch (_error) {
    void load().catch(() => {});
  }
  updateControls();

  return {
    state,
    load,
    previous: actions.previous,
    next: actions.next,
    zoomOut: actions.zoomOut,
    zoomIn: actions.zoomIn,
    toggleFullscreen: actions.toggleFullscreen,
    async destroy() {
      if (state.destroyed) return;
      state.destroyed = true;
      renderGeneration += 1;
      observer.disconnect();
      renderTask?.cancel();
      for (const [element, listener] of listeners) {
        element.removeEventListener("click", listener);
      }
      await Promise.allSettled([
        loadingTask?.destroy?.(),
        pdfDocument?.destroy?.(),
      ]);
      updateControls();
    },
  };
}

export function mountPublicationViewer(root, pdfjs) {
  return createViewerController({ root, pdfjs });
}

export const loadPdfjs = () =>
  import("/assets/vendor/pdfjs/pdf.min.mjs");

export async function bootstrapPublicationViewers({
  documentRoot = document,
  loadPdfjsImpl = loadPdfjs,
} = {}) {
  const roots = Array.from(
    documentRoot.querySelectorAll("[data-publication-viewer]"),
  );
  if (roots.length === 0) return [];

  let pdfjs;
  try {
    pdfjs = await loadPdfjsImpl();
  } catch (_error) {
    for (const root of roots) revealViewerFallback(root);
    return [];
  }

  pdfjs.GlobalWorkerOptions.workerSrc =
    "/assets/vendor/pdfjs/pdf.worker.min.mjs";
  const controllers = [];
  for (const root of roots) {
    try {
      controllers.push(mountPublicationViewer(root, pdfjs));
    } catch (_error) {
      revealViewerFallback(root);
    }
  }
  return controllers;
}

if (typeof document !== "undefined") {
  void bootstrapPublicationViewers();
}
