type Listener = (active: boolean) => void;

let activeCount = 0;
const listeners = new Set<Listener>();

export const revalidationBus = {
  start() {
    activeCount++;
    if (activeCount === 1) listeners.forEach(fn => fn(true));
  },
  stop() {
    activeCount = Math.max(0, activeCount - 1);
    if (activeCount === 0) listeners.forEach(fn => fn(false));
  },
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
