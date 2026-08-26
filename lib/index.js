/**
 * dsh-naiwa-skin — node half.
 *
 * Pure browser-side skin: the empty apply exists so the row appears in the
 * host Loader, while the whole skin ships through exports["./client"],
 * discovered from the package.json `dsh.client` declaration. Nothing runs
 * host-side; no services are provided.
 */

/** Host plugin body — this package contributes nothing host-side. */
export function apply() {}
