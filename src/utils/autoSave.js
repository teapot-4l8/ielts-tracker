/**
 * Debounced auto-saver: calls saveAll() at most once per tick,
 * no matter how many "trigger" calls fire in rapid succession.
 */
import { saveAll } from './dataSync'

let timer = null

export function triggerAutoSave() {
  if (timer) return
  timer = setTimeout(() => {
    timer = null
    saveAll()
  }, 500)
}
