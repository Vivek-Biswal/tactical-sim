import type * as Cesium from "cesium";

declare global {
  interface Window { Cesium?: typeof Cesium; CESIUM_BASE_URL?: string }
}
let loading: Promise<typeof Cesium> | undefined;
/** Load the pinned npm distribution only after the user opens 3D. */
export function loadCesium(): Promise<typeof Cesium> {
  if (window.Cesium) return Promise.resolve(window.Cesium);
  if (loading) return loading;
  window.CESIUM_BASE_URL = "/cesium/";
  loading = new Promise<typeof Cesium>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/cesium/Cesium.js";
    script.async = true;
    const timeout = window.setTimeout(() => fail(), 20000);
    function fail() {
      window.clearTimeout(timeout);
      script.remove();
      reject(new Error("Unable to load the 3D map. Return to 2D or retry."));
    }
    script.onerror = fail;
    script.onload = () => {
      window.clearTimeout(timeout);
      if (window.Cesium) resolve(window.Cesium); else fail();
    };
    document.head.appendChild(script);
  }).catch(error => { loading = undefined; throw error; });
  return loading;
}
