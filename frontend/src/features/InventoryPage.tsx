import { useMemo, useState, type FormEvent } from 'react'
import {
  AlertTriangle,
  Check,
  PackagePlus,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Truck,
  X,
} from 'lucide-react'
import {
  readDemoUnavailableMenuItems,
  writeDemoUnavailableMenuItems,
} from './demoMenuAvailability'

type StockStatus = 'In stock' | 'Low stock' | 'Critical' | 'Out of stock'
type InventoryItem = {
  id: string
  name: string
  quantity: number
  unit: string
  threshold: number
  supplier: string
  leadDays: number
  updatedAt: string
  usagePerDay?: number
}
type RestockRequest = {
  id: string
  itemName: string
  quantity: number
  supplier: string
  deliveryDate: string
  notes: string
  status: 'Requested' | 'Received' | 'Cancelled'
}
type InventoryMovement = {
  id: string
  itemName: string
  kind: string
  quantity: number
  unit: string
  reason: string
  time: string
}

const initialInventory: InventoryItem[] = [
  { id: 'milk', name: 'Whole milk', quantity: 5, unit: 'L', threshold: 8, supplier: 'Dairy Fresh Co.', leadDays: 1, updatedAt: 'Today, 10:20', usagePerDay: 18 },
  { id: 'beans', name: 'Coffee beans', quantity: 8.4, unit: 'kg', threshold: 5, supplier: 'Highland Roasters', leadDays: 2, updatedAt: 'Today, 10:14', usagePerDay: 3.1 },
  { id: 'oat-milk', name: 'Oat milk', quantity: 3, unit: 'L', threshold: 6, supplier: 'Plant Pour Supply', leadDays: 2, updatedAt: 'Today, 09:52', usagePerDay: 4 },
  { id: 'tea', name: 'Tea leaves', quantity: 2.6, unit: 'kg', threshold: 2, supplier: 'Leaf & Kettle', leadDays: 3, updatedAt: 'Today, 09:40', usagePerDay: 0.7 },
  { id: 'sugar', name: 'Sugar', quantity: 12, unit: 'kg', threshold: 5, supplier: 'City Foods', leadDays: 2, updatedAt: 'Today, 09:18', usagePerDay: 2.1 },
  { id: 'chocolate', name: 'Chocolate', quantity: 1.2, unit: 'kg', threshold: 3, supplier: 'Cocoa House', leadDays: 2, updatedAt: 'Today, 09:03', usagePerDay: 0.8 },
  { id: 'syrup', name: 'Vanilla syrup', quantity: 2, unit: 'L', threshold: 2, supplier: 'Barista Supply', leadDays: 4, updatedAt: 'Today, 08:47', usagePerDay: 0.5 },
  { id: 'cream', name: 'Fresh cream', quantity: 4, unit: 'L', threshold: 4, supplier: 'Dairy Fresh Co.', leadDays: 1, updatedAt: 'Today, 08:36', usagePerDay: 5 },
  { id: 'cheese', name: 'Cheese', quantity: 4.8, unit: 'kg', threshold: 3, supplier: 'City Foods', leadDays: 2, updatedAt: 'Today, 08:22', usagePerDay: 1.4 },
  { id: 'bread', name: 'Sourdough bread', quantity: 3, unit: 'loaves', threshold: 6, supplier: 'Daily Crust Bakery', leadDays: 1, updatedAt: 'Today, 08:09', usagePerDay: 8 },
  { id: 'flour', name: 'Flour', quantity: 9, unit: 'kg', threshold: 5, supplier: 'City Foods', leadDays: 2, updatedAt: 'Today, 07:55', usagePerDay: 2 },
  { id: 'pasta', name: 'Pasta', quantity: 6, unit: 'kg', threshold: 3, supplier: 'City Foods', leadDays: 2, updatedAt: 'Today, 07:40', usagePerDay: 1.5 },
  { id: 'vegetables', name: 'Mixed vegetables', quantity: 5.5, unit: 'kg', threshold: 5, supplier: 'Green Basket', leadDays: 1, updatedAt: 'Today, 07:31', usagePerDay: 7 },
  { id: 'paneer', name: 'Paneer', quantity: 0, unit: 'kg', threshold: 2, supplier: 'Dairy Fresh Co.', leadDays: 1, updatedAt: 'Today, 07:21', usagePerDay: 2.8 },
  { id: 'eggs', name: 'Eggs', quantity: 24, unit: 'pcs', threshold: 12, supplier: 'Farmgate Eggs', leadDays: 1, updatedAt: 'Today, 07:05', usagePerDay: 30 },
  { id: 'cups', name: 'Takeaway cups', quantity: 42, unit: 'pcs', threshold: 30, supplier: 'PackRight', leadDays: 3, updatedAt: 'Yesterday, 18:10', usagePerDay: 55 },
  { id: 'lids', name: 'Cup lids', quantity: 18, unit: 'pcs', threshold: 30, supplier: 'PackRight', leadDays: 3, updatedAt: 'Yesterday, 18:10', usagePerDay: 55 },
  { id: 'napkins', name: 'Napkins', quantity: 680, unit: 'pcs', threshold: 250, supplier: 'PackRight', leadDays: 3, updatedAt: 'Yesterday, 17:50', usagePerDay: 190 },
  { id: 'containers', name: 'Food containers', quantity: 56, unit: 'pcs', threshold: 40, supplier: 'PackRight', leadDays: 3, updatedAt: 'Yesterday, 17:32', usagePerDay: 48 },
]
const INVENTORY_SESSION_KEY = 'br-cafe-demo-inventory-session-v1'

const affectedMenu: Record<string, string[]> = {
  milk: ['Cappuccino', 'Café Latte', 'Flat White', 'Masala Chai'],
  'oat-milk': ['Café Latte (oat option)', 'Iced Latte (oat option)'],
  beans: ['Espresso', 'Americano', 'Cappuccino', 'Café Latte'],
  chocolate: ['Café Mocha', 'Chocolate Milkshake', 'Chocolate Brownie'],
  cheese: ['Grilled Cheese Sandwich', 'Margherita Pizza', 'Paneer Tikka Pizza'],
  bread: ['Veg Sandwich', 'Paneer Sandwich', 'Croissant Sandwich'],
  paneer: ['Paneer Sandwich', 'Paneer Wrap', 'Paneer Burger', 'Paneer Tikka Pizza'],
  eggs: ['Egg Sandwich', 'Egg Wrap', 'Masala Omelette'],
  cups: ['All takeaway drinks'],
  lids: ['All takeaway drinks'],
  containers: ['Takeaway meals'],
}

function stockStatus(item: InventoryItem): StockStatus {
  if (item.quantity <= 0) return 'Out of stock'
  if (item.quantity <= item.threshold * 0.5) return 'Critical'
  if (item.quantity <= item.threshold) return 'Low stock'
  return 'In stock'
}

function readSessionInventory() {
  try {
    const saved = window.sessionStorage.getItem(INVENTORY_SESSION_KEY)
    if (!saved) return initialInventory
    const parsed: unknown = JSON.parse(saved)
    if (!Array.isArray(parsed)) return initialInventory
    const validItems = parsed.filter((entry): entry is InventoryItem => {
      if (!entry || typeof entry !== 'object') return false
      const item = entry as Partial<InventoryItem>
      return (
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.quantity === 'number' &&
        typeof item.unit === 'string' &&
        typeof item.threshold === 'number' &&
        typeof item.supplier === 'string' &&
        typeof item.leadDays === 'number' &&
        typeof item.updatedAt === 'string'
      )
    })
    return validItems.length ? validItems : initialInventory
  } catch {
    return initialInventory
  }
}

function badgeTone(status: StockStatus) {
  if (status === 'Out of stock') return 'bg-rose-500/15 text-rose-200'
  if (status === 'Critical') return 'bg-[#B8955C]/20 text-[#E5D6B7]'
  if (status === 'Low stock') return 'bg-[#B8955C]/10 text-[#D6C29D]'
  return 'bg-stone-500/10 text-stone-200'
}

function InventoryPage() {
  const [items, setItems] = useState(readSessionInventory)
  const [requests, setRequests] = useState<RestockRequest[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [acknowledged, setAcknowledged] = useState<string[]>([])
  const [unavailableMenuItems, setUnavailableMenuItems] = useState<string[]>(readDemoUnavailableMenuItems)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | StockStatus>('all')
  const [modal, setModal] = useState<'add' | 'restock' | 'adjust' | null>(null)
  const [activeItemId, setActiveItemId] = useState('')
  const [message, setMessage] = useState('')

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const status = stockStatus(item)
        return (
          (statusFilter === 'all' || status === statusFilter) &&
          `${item.name} ${item.supplier}`.toLowerCase().includes(search.toLowerCase())
        )
      }),
    [items, search, statusFilter],
  )

  const counts = useMemo(
    () =>
      items.reduce(
        (result, item) => {
          result[stockStatus(item)] += 1
          return result
        },
        { 'In stock': 0, 'Low stock': 0, Critical: 0, 'Out of stock': 0 } as Record<StockStatus, number>,
      ),
    [items],
  )

  const activeAlerts = items.filter((item) => stockStatus(item) !== 'In stock' && !acknowledged.includes(item.id))
  const pendingRequests = requests.filter((request) => request.status === 'Requested').length
  const openModal = (kind: typeof modal, itemId = '') => {
    setActiveItemId(itemId)
    setMessage('')
    setModal(kind)
  }

  const saveInventory = (nextItems: InventoryItem[]) => {
    setItems(nextItems)
    try {
      window.sessionStorage.setItem(INVENTORY_SESSION_KEY, JSON.stringify(nextItems))
    } catch {
      setMessage('Inventory changes are only available until you leave this page because browser session storage is unavailable.')
    }
  }

  const setAvailabilityForItem = (item: InventoryItem) => {
    const linkedItems = affectedMenu[item.id] ?? []
    if (!linkedItems.length) return
    const current = new Set(unavailableMenuItems)
    const shouldMarkUnavailable = linkedItems.some((name) => !current.has(name))
    linkedItems.forEach((name) => {
      if (shouldMarkUnavailable) current.add(name)
      else if (stockStatus(item) !== 'Out of stock') current.delete(name)
    })
    const nextItems = [...current]
    setUnavailableMenuItems(nextItems)
    writeDemoUnavailableMenuItems(nextItems)
  }

  const addItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const unit = String(form.get('unit') ?? '').trim()
    const quantity = Number(form.get('quantity'))
    const threshold = Number(form.get('threshold'))
    const supplier = String(form.get('supplier') ?? '').trim()
    if (!name || !unit || !Number.isFinite(quantity) || quantity < 0 || !Number.isFinite(threshold) || threshold <= 0) {
      setMessage('Enter a name, unit, valid quantity, and a threshold greater than zero.')
      return
    }
    const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`
    saveInventory([
      { id, name, quantity, unit, threshold, supplier: supplier || 'Not configured', leadDays: 0, updatedAt: 'Just now' },
      ...items,
    ])
    setMessage('Inventory item added to this local demo view.')
    setModal(null)
  }

  const requestRestock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const item = items.find((entry) => entry.id === String(form.get('itemId')))
    const quantity = Number(form.get('quantity'))
    const deliveryDate = String(form.get('deliveryDate'))
    if (!item || !Number.isFinite(quantity) || quantity <= 0 || !deliveryDate) {
      setMessage('Choose an item, enter a positive quantity, and select an estimated delivery date.')
      return
    }
    setRequests((current) => [
      {
        id: `RST-${Date.now().toString().slice(-6)}`,
        itemName: item.name,
        quantity,
        supplier: item.supplier,
        deliveryDate,
        notes: String(form.get('notes') ?? ''),
        status: 'Requested',
      },
      ...current,
    ])
    setModal(null)
    setMessage(`Restock request created for ${item.name}. On-hand stock was not changed.`)
  }

  const adjustStock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const item = items.find((entry) => entry.id === String(form.get('itemId')))
    const action = String(form.get('action'))
    const amount = Number(form.get('quantity'))
    const reason = String(form.get('reason') ?? '').trim()
    if (!item || !Number.isFinite(amount) || amount <= 0 || !reason) {
      setMessage('Select an item, enter a positive quantity, and provide a reason.')
      return
    }
    const delta = action === 'delivery' ? amount : -amount
    const resulting = item.quantity + delta
    if (resulting < 0) {
      setMessage(`Adjustment would result in ${resulting} ${item.unit}. Enter a quantity no greater than the usable stock.`)
      return
    }
    const confirmed = window.confirm(
      `Confirm ${action} adjustment for ${item.name}?\nCurrent: ${item.quantity} ${item.unit}\nChange: ${delta > 0 ? '+' : ''}${delta} ${item.unit}\nExpected after: ${resulting} ${item.unit}\n\nThis is a local demo action and is not recorded on the server.`,
    )
    if (!confirmed) return

    saveInventory(
      items.map((entry) =>
        entry.id === item.id
          ? { ...entry, quantity: resulting, updatedAt: 'Just now' }
          : entry,
      ),
    )
    if (action === 'delivery') {
      setRequests((current) =>
        current.map((request) =>
          request.itemName === item.name && request.status === 'Requested'
            ? { ...request, status: 'Received' }
            : request,
        ),
      )
    }
    setMovements((current) => [
      {
        id: `MOV-${Date.now().toString().slice(-6)}`,
        itemName: item.name,
        kind: action === 'delivery' ? 'Delivery received' : action === 'consumption' ? 'Consumption correction' : action === 'spoilage' ? 'Spoilage / waste' : 'Manual correction',
        quantity: delta,
        unit: item.unit,
        reason,
        time: new Date().toLocaleString(),
      },
      ...current,
    ])
    const linkedMenuItems = affectedMenu[item.id] ?? []
    if (linkedMenuItems.length) {
      const unavailable = new Set(unavailableMenuItems)
      linkedMenuItems.forEach((name) => {
        if (resulting <= 0) unavailable.add(name)
        else unavailable.delete(name)
      })
      const nextUnavailable = [...unavailable]
      setUnavailableMenuItems(nextUnavailable)
      writeDemoUnavailableMenuItems(nextUnavailable)
    }
    setAcknowledged([])
    setModal(null)
    setMessage(`${item.name} quantity updated in this local demo view.`)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs tracking-[0.22em] text-stone-400 uppercase">Inventory & procurement</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#F4EFE6]">Stock overview</h1>
          <p className="mt-1 text-sm text-stone-400">Ingredient and supply visibility for BR CAFÉ Downtown.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => openModal('restock')} className="inline-flex items-center gap-2 rounded-xl border border-stone-600 bg-[#1A1814] px-3 py-2 text-sm text-stone-200 hover:bg-[#24211C]"><Truck className="h-4 w-4" /> Request restock</button>
          <button type="button" onClick={() => openModal('add')} className="inline-flex items-center gap-2 rounded-xl bg-[#C6A269] px-3 py-2 text-sm font-semibold text-[#1A1814] hover:bg-[#D2B677]"><Plus className="h-4 w-4" /> Add item</button>
        </div>
      </div>

      <div className="rounded-xl border border-[#B8955C]/25 bg-[#B8955C]/5 p-3 text-xs leading-5 text-[#E5D6B7]">
        <strong>Local demo inventory.</strong> Stock, alerts, requests, and adjustments are temporary browser-session state only. The backend does not currently expose inventory APIs; no action here is persisted to the server or presented as server-confirmed.
      </div>

      {message && <div role="status" className="flex items-start justify-between gap-3 rounded-xl border border-[#B8955C]/15 bg-[#B8955C]/5 p-3 text-sm text-[#E5D6B7]"><span>{message}</span><button type="button" aria-label="Dismiss message" onClick={() => setMessage('')}><X className="h-4 w-4" /></button></div>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {[
          ['Tracked items', items.length, 'text-[#F4EFE6]'],
          ['In stock', counts['In stock'], 'text-[#D6C29D]'],
          ['Low stock', counts['Low stock'], 'text-[#D6C29D]'],
          ['Critical', counts.Critical, 'text-orange-200'],
          ['Out of stock', counts['Out of stock'], 'text-rose-200'],
          ['Pending restocks', pendingRequests, 'text-[#D6C29D]'],
        ].map(([label, value, tone]) => (
          <div key={String(label)} className="rounded-2xl border border-stone-700 bg-[#1A1814] p-4">
            <p className="text-xs text-stone-400">{label}</p>
            <p className={`mt-2 text-2xl font-semibold ${tone}`}>{value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
        <section className="min-w-0 rounded-2xl border border-stone-700 bg-[#1A1814]">
          <div className="flex flex-col gap-3 border-b border-stone-700 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Inventory items</h2>
              <p className="mt-1 text-xs text-stone-400">Thresholds are configurable per item; critical is 50% or less of threshold.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="flex h-9 items-center gap-2 rounded-lg border border-stone-700 bg-[#12110F] px-2.5">
                <Search className="h-4 w-4 text-stone-500" />
                <input aria-label="Search inventory" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search stock" className="w-32 bg-transparent text-xs outline-none placeholder:text-stone-500" />
              </label>
              <label className="flex h-9 items-center gap-2 rounded-lg border border-stone-700 bg-[#12110F] px-2.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-stone-500" />
                <select aria-label="Filter inventory status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="bg-transparent text-xs text-stone-200 outline-none">
                  <option value="all">All statuses</option>
                  <option>In stock</option><option>Low stock</option><option>Critical</option><option>Out of stock</option>
                </select>
              </label>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[950px] w-full text-left text-xs">
              <thead><tr className="text-stone-400">
                <th className="px-4 py-3 font-medium">Ingredient / supply</th>
                <th className="px-3 py-3 font-medium">Usable</th>
                <th className="px-3 py-3 font-medium">Threshold</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Usage / day</th>
                <th className="px-3 py-3 font-medium">Supplier · lead</th>
                <th className="px-3 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr></thead>
              <tbody>
                {filteredItems.map((item) => {
                  const status = stockStatus(item)
                  const daysLeft = item.usagePerDay ? item.quantity / item.usagePerDay : null
                  return (
                    <tr key={item.id} className="border-t border-stone-800 hover:bg-[#24211C]/60">
                      <td className="px-4 py-3">
                        <p className="font-medium text-stone-100">{item.name}</p>
                        <p className="mt-1 text-[10px] text-stone-500">{affectedMenu[item.id]?.length ? `Menu: ${affectedMenu[item.id].slice(0, 2).join(', ')}${affectedMenu[item.id].length > 2 ? '…' : ''}` : 'No linked menu item'}</p>
                      </td>
                      <td className="px-3 py-3 font-medium text-stone-200">{item.quantity} {item.unit}</td>
                      <td className="px-3 py-3 text-stone-300">{item.threshold} {item.unit}</td>
                      <td className="px-3 py-3"><span className={`whitespace-nowrap rounded-full px-2 py-1 text-[10px] ${badgeTone(status)}`}>{status}</span></td>
                      <td className="px-3 py-3 text-stone-300">{item.usagePerDay ? `${item.usagePerDay} ${item.unit}/day · ${daysLeft && daysLeft >= 0 ? `~${daysLeft.toFixed(1)}d` : '0d'}` : 'Insufficient data for forecast'}</td>
                      <td className="px-3 py-3 text-stone-300">{item.supplier}<span className="block text-stone-500">{item.leadDays ? `${item.leadDays}d lead` : 'Lead unknown'}</span></td>
                      <td className="px-3 py-3 text-stone-400">{item.updatedAt}</td>
                      <td className="px-4 py-3"><div className="flex gap-1.5">
                        <button type="button" onClick={() => openModal('restock', item.id)} className="rounded-lg border border-stone-700 px-2 py-1.5 text-[#D6C29D] hover:bg-[#1A1814]">Restock</button>
                        <button type="button" onClick={() => openModal('adjust', item.id)} className="rounded-lg border border-stone-700 px-2 py-1.5 text-stone-200 hover:bg-[#1A1814]">Adjust</button>
                        {affectedMenu[item.id] && (
                          stockStatus(item) === 'Out of stock' ? (
                            <span className="rounded-lg border border-rose-500/20 px-2 py-1.5 text-rose-200">
                              Menu blocked by stock
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAvailabilityForItem(item)}
                              className="rounded-lg border border-stone-700 px-2 py-1.5 text-stone-300 hover:bg-[#1A1814]"
                            >
                              {affectedMenu[item.id].every((name) => unavailableMenuItems.includes(name))
                                ? 'Restore menu'
                                : 'Mark menu unavailable'}
                            </button>
                          )
                        )}
                      </div></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filteredItems.length === 0 && <div className="p-8 text-center text-sm text-stone-400">No inventory items match those filters.</div>}
          </div>
        </section>

        <section className="rounded-2xl border border-stone-700 bg-[#1A1814] p-4">
          <div className="flex items-start justify-between">
            <div><p className="text-xs tracking-[0.18em] text-stone-400 uppercase">Alert center</p><h2 className="mt-1 font-semibold">Stock needs attention</h2></div>
            <span className="rounded-full bg-rose-500/10 px-2 py-1 text-xs text-rose-200">{activeAlerts.length} open</span>
          </div>
          <div className="mt-4 space-y-3">
            {activeAlerts.length ? activeAlerts.map((item) => {
              const status = stockStatus(item)
              return (
                <article key={item.id} className="rounded-xl border border-stone-700 bg-[#12110F] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-2">
                      <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${status === 'Low stock' ? 'text-[#C6A269]' : 'text-rose-300'}`} />
                      <div><p className="text-sm font-medium">{item.name}</p><p className="mt-1 text-xs text-stone-400">{item.quantity} {item.unit} remaining · threshold {item.threshold} {item.unit}</p><p className="mt-1 text-[10px] text-stone-500">Just refreshed · demo stock</p></div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] ${badgeTone(status)}`}>{status}</span>
                  </div>
                  {affectedMenu[item.id] && <p className="ml-6 mt-2 text-xs text-[#E5D6B7]/80">May affect: {affectedMenu[item.id].join(', ')}</p>}
                  <div className="ml-6 mt-3 flex gap-2">
                    <button type="button" onClick={() => openModal('restock', item.id)} className="rounded-lg bg-[#C6A269] px-2.5 py-1.5 text-xs font-semibold text-[#1A1814]">Restock item</button>
                    <button type="button" onClick={() => setAcknowledged((current) => [...current, item.id])} className="rounded-lg border border-stone-700 px-2.5 py-1.5 text-xs text-stone-300">Acknowledge</button>
                  </div>
                </article>
              )
            }) : <div className="rounded-xl border border-stone-700 bg-[#12110F] p-5 text-center text-sm text-stone-400"><Check className="mx-auto mb-2 h-5 w-5 text-[#C6A269]" />No unacknowledged alerts</div>}
          </div>
          <p className="mt-3 text-[10px] leading-4 text-stone-500">Forecasts are estimates from seeded demo usage rates. “Out of stock” menu availability must be verified by backend recipe and stock checks.</p>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-stone-700 bg-[#1A1814] p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-xs tracking-[0.18em] text-stone-400 uppercase">Procurement</p><h2 className="mt-1 font-semibold">Restock requests</h2></div>
            <button type="button" onClick={() => openModal('restock')} className="inline-flex items-center gap-1 text-xs text-[#D6C29D]"><PackagePlus className="h-4 w-4" /> New request</button>
          </div>
          {requests.length ? (
            <div className="mt-4 space-y-2">
              {requests.map((request) => (
                <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-700 bg-[#12110F] p-3 text-sm">
                  <div><p className="font-medium">{request.itemName} · {request.quantity}</p><p className="mt-1 text-xs text-stone-400">{request.id} · {request.supplier} · ETA {request.deliveryDate}</p>{request.notes && <p className="mt-1 text-xs text-stone-500">{request.notes}</p>}</div>
                  <span className={`rounded-full px-2 py-1 text-[10px] ${request.status === 'Received' ? 'bg-[#B8955C]/10 text-[#D6C29D]' : 'bg-[#B8955C]/10 text-[#D6C29D]'}`}>{request.status}</span>
                </div>
              ))}
            </div>
          ) : <div className="mt-4 rounded-xl border border-dashed border-stone-700 p-6 text-center text-sm text-stone-400">No restock requests yet. Creating a request does not increase available stock.</div>}
        </section>

        <section className="rounded-2xl border border-stone-700 bg-[#1A1814] p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-xs tracking-[0.18em] text-stone-400 uppercase">Audit trail</p><h2 className="mt-1 font-semibold">Inventory movements</h2></div>
            <RefreshCw className="h-4 w-4 text-stone-500" />
          </div>
          {movements.length ? (
            <div className="mt-4 space-y-2">
              {movements.map((movement) => (
                <div key={movement.id} className="rounded-xl border border-stone-700 bg-[#12110F] p-3">
                  <div className="flex justify-between gap-2 text-sm"><span className="font-medium">{movement.itemName} · {movement.kind}</span><span className={movement.quantity > 0 ? 'text-[#D6C29D]' : 'text-[#D6C29D]'}>{movement.quantity > 0 ? '+' : ''}{movement.quantity} {movement.unit}</span></div>
                  <p className="mt-1 text-xs text-stone-400">{movement.reason}</p><p className="mt-1 text-[10px] text-stone-500">{movement.time} · Manager demo action</p>
                </div>
              ))}
            </div>
          ) : <div className="mt-4 rounded-xl border border-dashed border-stone-700 p-6 text-center text-sm text-stone-400">No stock movements recorded in this session.</div>}
        </section>
      </div>

      {modal && (
        <InventoryModal
          kind={modal}
          items={items}
          activeItemId={activeItemId}
          onClose={() => setModal(null)}
          onAdd={addItem}
          onRestock={requestRestock}
          onAdjust={adjustStock}
          message={message}
        />
      )}
    </div>
  )
}

function InventoryModal({
  kind,
  items,
  activeItemId,
  onClose,
  onAdd,
  onRestock,
  onAdjust,
  message,
}: {
  kind: 'add' | 'restock' | 'adjust'
  items: InventoryItem[]
  activeItemId: string
  onClose: () => void
  onAdd: (event: FormEvent<HTMLFormElement>) => void
  onRestock: (event: FormEvent<HTMLFormElement>) => void
  onAdjust: (event: FormEvent<HTMLFormElement>) => void
  message: string
}) {
  const [minimumDeliveryDate] = useState(() => new Date().toISOString().slice(0, 10))
  const activeItem = items.find((item) => item.id === activeItemId)
  const handler = kind === 'add' ? onAdd : kind === 'restock' ? onRestock : onAdjust
  const title = kind === 'add' ? 'Add inventory item' : kind === 'restock' ? 'Request restock' : 'Adjust stock'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4">
      <form onSubmit={handler} className="my-auto w-full max-w-lg rounded-2xl border border-stone-700 bg-[#1A1814] p-5">
        <div className="flex items-start justify-between"><div><p className="text-xs tracking-[0.2em] text-stone-400 uppercase">Local demo action</p><h2 className="mt-1 text-xl font-semibold">{title}</h2></div><button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg border border-stone-700 p-2"><X className="h-4 w-4" /></button></div>
        {kind === 'add' ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Field label="Item name"><input required name="name" maxLength={80} className={inputClass} /></Field>
            <Field label="Unit (L, kg, pcs)"><input required name="unit" maxLength={20} className={inputClass} /></Field>
            <Field label="Opening quantity"><input required name="quantity" type="number" min="0" step="0.01" className={inputClass} /></Field>
            <Field label="Low-stock threshold"><input required name="threshold" type="number" min="0.01" step="0.01" className={inputClass} /></Field>
            <Field label="Supplier"><input name="supplier" maxLength={80} className={inputClass} /></Field>
          </div>
        ) : kind === 'restock' ? (
          <div className="mt-5 space-y-3">
            <Field label="Inventory item"><select name="itemId" required defaultValue={activeItemId} className={inputClass}><option value="" disabled>Select item</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.quantity} {item.unit}</option>)}</select></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Requested quantity"><input required name="quantity" type="number" min="0.01" step="0.01" className={inputClass} /></Field>
              <Field label="Estimated delivery"><input required name="deliveryDate" type="date" min={minimumDeliveryDate} className={inputClass} /></Field>
            </div>
            {activeItem && <p className="text-xs text-stone-400">Supplier: {activeItem.supplier} · {activeItem.leadDays ? `${activeItem.leadDays} day lead time` : 'lead time not configured'}</p>}
            <Field label="Notes"><textarea name="notes" maxLength={300} rows={3} className={inputClass} /></Field>
            <p className="rounded-lg border border-[#B8955C]/15 bg-[#B8955C]/5 p-3 text-xs text-[#E5D6B7]">Submitting a restock request does not add to on-hand stock. Record the actual delivery using Adjust stock when received.</p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <Field label="Inventory item"><select name="itemId" required defaultValue={activeItemId} className={inputClass}><option value="" disabled>Select item</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.quantity} {item.unit}</option>)}</select></Field>
            {activeItem && <p className="text-xs text-stone-400">Current usable stock: {activeItem.quantity} {activeItem.unit}</p>}
            <Field label="Adjustment type"><select name="action" className={inputClass}><option value="delivery">New delivery received (+)</option><option value="consumption">Consumption correction (-)</option><option value="spoilage">Spoilage / waste (-)</option><option value="damaged">Damaged / unusable stock (-)</option><option value="manual">Manual correction (-)</option></select></Field>
            <Field label="Quantity"><input required name="quantity" type="number" min="0.01" step="0.01" className={inputClass} /></Field>
            <Field label="Required reason"><textarea required name="reason" maxLength={300} rows={3} className={inputClass} /></Field>
            <p className="rounded-lg border border-[#B8955C]/20 bg-[#B8955C]/5 p-3 text-xs text-[#E5D6B7]">You will review the expected resulting quantity and confirm before applying this local demo adjustment. Production permission checks are not available yet.</p>
          </div>
        )}
        {message && <p role="alert" className="mt-3 text-sm text-rose-200">{message}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-stone-700 px-4 py-2.5 text-sm text-stone-300">Cancel</button>
          <button type="submit" className="rounded-xl bg-[#C6A269] px-4 py-2.5 text-sm font-semibold text-[#1A1814]">{kind === 'add' ? 'Add item' : kind === 'restock' ? 'Create request' : 'Review & adjust'}</button>
        </div>
      </form>
    </div>
  )
}

const inputClass = 'mt-1.5 w-full rounded-xl border border-stone-700 bg-[#12110F] px-3 py-2.5 text-sm text-stone-100 outline-none focus:border-[#C6A269]'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm text-stone-300">{label}{children}</label>
}

export default InventoryPage
