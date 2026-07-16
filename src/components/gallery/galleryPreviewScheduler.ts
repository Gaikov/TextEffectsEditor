type GalleryPreviewRenderJob = (done: () => void) => void;

interface QueueItem {
  cancelled: boolean;
  job: GalleryPreviewRenderJob;
}

const queue: QueueItem[] = [];
let scheduled = false;

function scheduleNext() {
  if (scheduled || queue.length === 0) return;
  scheduled = true;

  const run = () => {
    scheduled = false;
    const item = queue.shift();
    if (!item) return;

    if (item.cancelled) {
      scheduleNext();
      return;
    }

    item.job(scheduleNext);
  };

  if (window.requestIdleCallback) {
    window.requestIdleCallback(run, { timeout: 250 });
  } else {
    window.setTimeout(run, 16);
  }
}

export function enqueueGalleryPreviewRender(job: GalleryPreviewRenderJob) {
  const item: QueueItem = { cancelled: false, job };
  queue.push(item);
  scheduleNext();

  return () => {
    item.cancelled = true;
  };
}
