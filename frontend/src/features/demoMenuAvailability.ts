const AVAILABILITY_KEY = 'br-cafe-demo-unavailable-menu-items-v1'
const AVAILABILITY_EVENT = 'br-cafe-demo-menu-availability'
const DEFAULT_STOCKOUT_MENU_ITEMS = [
  'Paneer Sandwich',
  'Paneer Wrap',
  'Paneer Burger',
  'Paneer Tikka Pizza',
]

export function readDemoUnavailableMenuItems() {
  try {
    const saved = window.sessionStorage.getItem(AVAILABILITY_KEY)
    if (!saved) return DEFAULT_STOCKOUT_MENU_ITEMS
    const parsed: unknown = JSON.parse(saved)
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : []
  } catch {
    return []
  }
}

export function writeDemoUnavailableMenuItems(items: string[]) {
  const uniqueItems = [...new Set(items)]
  window.sessionStorage.setItem(AVAILABILITY_KEY, JSON.stringify(uniqueItems))
  window.dispatchEvent(new Event(AVAILABILITY_EVENT))
}

export function listenForDemoMenuAvailability(onChange: (items: string[]) => void) {
  const refresh = () => onChange(readDemoUnavailableMenuItems())
  window.addEventListener('storage', refresh)
  window.addEventListener(AVAILABILITY_EVENT, refresh)
  return () => {
    window.removeEventListener('storage', refresh)
    window.removeEventListener(AVAILABILITY_EVENT, refresh)
  }
}
