import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  Clock3,
  Coffee,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react'
import { ApiError, submitCustomerOrder, type ApiOrder } from '../lib/api'
import {
  menuCategories,
  menuItems,
  menuPriceDisclaimer,
  type MenuItem,
} from './menu'
import {
  listenForDemoMenuAvailability,
  readDemoUnavailableMenuItems,
} from './demoMenuAvailability'

type CartLine = {
  key: string
  item: MenuItem
  quantity: number
  selections: Record<string, string>
}

type CustomerReceipt = {
  order: ApiOrder
  displayName: string
  fulfillment: 'Dine-in' | 'Takeaway' | 'Pickup'
}

const CART_KEY = 'br-cafe-customer-cart-v1'
const TRACKING_KEY = 'br-cafe-customer-last-confirmed-order-v1'
const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

function getUnitPrice(line: CartLine) {
  return (
    line.item.price +
    line.item.optionGroups.reduce((sum, group) => {
      const choice = group.options.find((option) => option.name === line.selections[group.label])
      return sum + (choice?.price ?? 0)
    }, 0)
  )
}

function readCart(): CartLine[] {
  try {
    const saved = window.localStorage.getItem(CART_KEY)
    if (!saved) return []
    const value: unknown = JSON.parse(saved)
    if (!Array.isArray(value)) return []
    return value.flatMap((entry): CartLine[] => {
      if (!entry || typeof entry !== 'object') return []
      const candidate = entry as {
        key?: unknown
        item?: { id?: unknown }
        quantity?: unknown
        selections?: unknown
      }
      const item =
        typeof candidate.item?.id === 'string'
          ? menuItems.find((menuItem) => menuItem.id === candidate.item?.id)
          : undefined
      if (
        !item ||
        typeof candidate.quantity !== 'number' ||
        !Number.isInteger(candidate.quantity) ||
        candidate.quantity < 1 ||
        !candidate.selections ||
        typeof candidate.selections !== 'object'
      ) {
        return []
      }
      const rawSelections = candidate.selections as Record<string, unknown>
      const selections = Object.fromEntries(
        item.optionGroups.flatMap((group) => {
          const selected = rawSelections[group.label]
          return typeof selected === 'string' &&
            group.options.some((option) => option.name === selected && option.available)
            ? [[group.label, selected]]
            : []
        }),
      )
      const key = `${item.id}:${Object.entries(selections).sort().map(([name, selected]) => `${name}=${selected}`).join('|')}`
      return [{ key, item, quantity: candidate.quantity, selections }]
    })
  } catch {
    return []
  }
}

function CustomerOrdering() {
  return (
    <Routes>
      <Route index element={<CustomerMenuPage />} />
      <Route path="track" element={<CustomerTrackingPage />} />
      <Route path="*" element={<CustomerMenuPage />} />
    </Routes>
  )
}

function CustomerMenuPage() {
  const [cart, setCart] = useState<CartLine[]>(readCart)
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchText, setSearchText] = useState('')
  const [dietFilter, setDietFilter] = useState<'all' | 'vegetarian' | 'non-vegetarian'>('all')
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [editingCartKey, setEditingCartKey] = useState<string | null>(null)
  const [unavailableMenuItems, setUnavailableMenuItems] = useState<string[]>(readDemoUnavailableMenuItems)
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')
  const navigate = useNavigate()

  const filteredItems = useMemo(
    () =>
      menuItems.filter((item) => {
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
        const matchesSearch =
          !searchText ||
          `${item.name} ${item.description}`.toLowerCase().includes(searchText.toLowerCase())
        const matchesDiet =
          dietFilter === 'all' ||
          (dietFilter === 'vegetarian' && item.dietary === 'Vegetarian') ||
          (dietFilter === 'non-vegetarian' && item.dietary === 'Non-vegetarian')
        return matchesCategory && matchesSearch && matchesDiet
      }),
    [dietFilter, searchText, selectedCategory],
  )

  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0)
  const subtotal = cart.reduce((sum, line) => sum + getUnitPrice(line) * line.quantity, 0)
  const estimatedTax = Math.round(subtotal * 0.05)
  const unavailableCartItems = cart.filter(
    (line) => !line.item.available || unavailableMenuItems.includes(line.item.name),
  )

  useEffect(() => listenForDemoMenuAvailability(setUnavailableMenuItems), [])

  const saveCart = (nextCart: CartLine[]) => {
    setCart(nextCart)
    window.localStorage.setItem(CART_KEY, JSON.stringify(nextCart))
  }

  const addItem = (item: MenuItem, quantity: number, selections: Record<string, string>) => {
    const key = `${item.id}:${Object.entries(selections).sort().map(([name, value]) => `${name}=${value}`).join('|')}`
    const match = cart.find((line) => line.key === key)
    saveCart(
      match
        ? cart.map((line) => (line.key === key ? { ...line, quantity: line.quantity + quantity } : line))
        : [...cart, { key, item, quantity, selections }],
    )
    setSelectedItem(null)
    setEditingCartKey(null)
    setNotice(`${item.name} added to your cart`)
    window.setTimeout(() => setNotice(''), 2600)
  }

  const saveCustomization = (
    item: MenuItem,
    quantity: number,
    selections: Record<string, string>,
  ) => {
    if (!editingCartKey) {
      addItem(item, quantity, selections)
      return
    }
    const oldLine = cart.find((line) => line.key === editingCartKey)
    if (!oldLine) {
      setSelectedItem(null)
      setEditingCartKey(null)
      return
    }
    const key = `${item.id}:${Object.entries(selections).sort().map(([name, value]) => `${name}=${value}`).join('|')}`
    const duplicate = cart.find((line) => line.key === key && line.key !== editingCartKey)
    saveCart(
      duplicate
        ? cart
            .filter((line) => line.key !== editingCartKey)
            .map((line) =>
              line.key === key ? { ...line, quantity: line.quantity + quantity } : line,
            )
        : cart.map((line) =>
            line.key === editingCartKey
              ? { ...line, key, item, quantity, selections }
              : line,
          ),
    )
    setSelectedItem(null)
    setEditingCartKey(null)
    setNotice('Cart item updated')
    window.setTimeout(() => setNotice(''), 2600)
  }

  const updateQuantity = (key: string, quantity: number) => {
    if (quantity < 1) {
      saveCart(cart.filter((line) => line.key !== key))
      return
    }
    saveCart(cart.map((line) => (line.key === key ? { ...line, quantity } : line)))
  }

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting || cart.length === 0) return
    if (unavailableCartItems.length > 0) {
      setCheckoutError(
        `Remove unavailable item${unavailableCartItems.length === 1 ? '' : 's'} before continuing: ${unavailableCartItems.map((line) => line.item.name).join(', ')}.`,
      )
      return
    }
    setSubmitting(true)
    setCheckoutError('')

    const form = new FormData(event.currentTarget)
    const displayName = String(form.get('displayName') ?? '').trim()
    const fulfillment = String(form.get('fulfillment') ?? 'Pickup') as CustomerReceipt['fulfillment']
    if (!displayName) {
      setCheckoutError('Enter a name for this order.')
      setSubmitting(false)
      return
    }

    const externalId = `BRWEB-${crypto.randomUUID()}`
    try {
      const response = await submitCustomerOrder({
        externalId,
        items: cart.map((line) => {
          const customizations = Object.entries(line.selections)
            .filter(([, value]) => value)
            .map(([label, value]) => `${label}: ${value}`)
          return {
            name: customizations.length
              ? `${line.item.name} (${customizations.join(', ')})`
              : line.item.name,
            qty: line.quantity,
            price: getUnitPrice(line),
            prep_minutes: line.item.prepMinutes,
          }
        }),
      })
      if (!response.created) {
        throw new ApiError('The server reported this order ID as a duplicate. No new order was created.')
      }

      const receipt = { order: response.order, displayName, fulfillment } satisfies CustomerReceipt
      window.sessionStorage.setItem(TRACKING_KEY, JSON.stringify(receipt))
      saveCart([])
      setCheckoutOpen(false)
      setCartOpen(false)
      navigate(`/order/track?order=${encodeURIComponent(response.order.external_id)}`)
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : 'The order could not be confirmed. Please retry.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0C0A] text-stone-100">
      <header className="sticky top-0 z-30 border-b border-stone-700/80 bg-[#12110F]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/order" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#C6A269]/40 bg-[#1A1814] font-black tracking-wider text-[#C6A269]">
              BR
            </div>
            <div>
              <p className="text-[10px] tracking-[0.32em] text-stone-400">BR CAFÉ</p>
              <p className="text-sm font-medium">Order online</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/order/track" className="hidden rounded-xl px-3 py-2 text-sm text-stone-300 hover:bg-[#24211C] sm:inline-flex">
              Track order
            </Link>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative inline-flex items-center gap-2 rounded-xl bg-[#C6A269] px-3 py-2 text-sm font-semibold text-[#1A1814] hover:bg-[#D2B677]"
            >
              <ShoppingBag className="h-4 w-4" />
              Cart
              {cartCount > 0 && <span className="rounded-full bg-[#1A1814] px-1.5 py-0.5 text-[10px] text-[#F4EFE6]">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-7 sm:px-6">
        <div className="mb-6 rounded-2xl border border-[#B8955C]/25 bg-[#B8955C]/5 px-4 py-3 text-xs leading-5 text-[#E5D6B7]">
          <strong className="font-semibold">Menu preview · demo prices.</strong> {menuPriceDisclaimer}
          <span className="mt-1 block text-[#E5D6B7]/70">
            Order creation uses the connected backend. The current API does not yet support customer fulfillment details, authoritative menu pricing, or secured live tracking.
          </span>
        </div>

        <section className="mb-8 grid gap-6 overflow-hidden rounded-3xl border border-stone-700 bg-[linear-gradient(115deg,#1A1814_5%,#29251F_50%,#12110F_100%)] p-6 sm:p-9 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs tracking-[0.24em] text-[#C6A269] uppercase">Made for your moment</p>
            <h1 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-[#F4EFE6] sm:text-5xl">
              Your café favourites, made fresh.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-stone-300">
              Browse the BR CAFÉ menu and build your order. Every drink and dish is prepared when you ask for it.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs text-stone-300">
              <span className="rounded-full border border-stone-600 bg-[#12110F]/70 px-3 py-1.5">Freshly prepared</span>
              <span className="rounded-full border border-stone-600 bg-[#12110F]/70 px-3 py-1.5">Vegetarian options</span>
              <span className="rounded-full border border-stone-600 bg-[#12110F]/70 px-3 py-1.5">Order pickup</span>
            </div>
          </div>
          <img
            src="https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=1200&q=85"
            alt="Warmly lit BR CAFÉ counter"
            className="h-52 w-full rounded-2xl border border-white/10 object-cover sm:h-64"
          />
        </section>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs tracking-[0.22em] text-stone-400 uppercase">The menu</p>
            <h2 className="mt-1 text-2xl font-semibold">Explore the menu</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="flex h-10 items-center gap-2 rounded-xl border border-stone-700 bg-[#1A1814] px-3">
              <Search className="h-4 w-4 text-stone-400" />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search menu"
                className="w-36 bg-transparent text-sm outline-none placeholder:text-stone-500 sm:w-48"
                aria-label="Search menu"
              />
            </label>
            <select
              value={dietFilter}
              onChange={(event) => setDietFilter(event.target.value as typeof dietFilter)}
              className="h-10 rounded-xl border border-stone-700 bg-[#1A1814] px-3 text-sm text-stone-200"
              aria-label="Filter by dietary type"
            >
              <option value="all">All items</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="non-vegetarian">Non-vegetarian</option>
            </select>
          </div>
        </div>

        <nav className="mb-6 flex gap-2 overflow-x-auto pb-2" aria-label="Menu categories">
          {['All', ...menuCategories].map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${
                selectedCategory === category
                  ? 'border-[#C6A269] bg-[#C6A269] text-[#1A1814]'
                  : 'border-stone-700 bg-[#1A1814] text-stone-300 hover:border-stone-500'
              }`}
            >
              {category}
            </button>
          ))}
        </nav>

        {filteredItems.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-stone-700 bg-[#1A1814] transition hover:border-stone-500">
                <div className="relative">
                  <img src={item.image} alt={item.name} loading="lazy" className="h-44 w-full object-cover" />
                  <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-medium ${item.dietary === 'Vegetarian' ? 'bg-stone-900/90 text-[#D6C29D]' : 'bg-rose-950/90 text-rose-200'}`}>
                    {item.dietary}
                  </span>
                  {!item.available && (
                    <span className="absolute inset-0 flex items-center justify-center bg-[#0D0C0A]/70 text-sm font-semibold text-[#F4EFE6]">
                      Currently unavailable
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-stone-100">{item.name}</h3>
                    <span className="shrink-0 text-sm font-semibold text-[#C6A269]">{inr.format(item.price)}</span>
                  </div>
                  <p className="mt-2 min-h-10 text-xs leading-5 text-stone-400">{item.description}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-stone-500">
                    <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{item.prepMinutes} min</span>
                    {item.allergens.length > 0 && <span>Contains {item.allergens.slice(0, 2).join(', ')}</span>}
                  </div>
                  <button
                    type="button"
                    disabled={!item.available || unavailableMenuItems.includes(item.name)}
                    onClick={() => setSelectedItem(item)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#C6A269]/40 bg-[#C6A269]/10 px-3 py-2.5 text-sm font-medium text-[#E0CEAA] transition hover:bg-[#C6A269]/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {!item.available || unavailableMenuItems.includes(item.name)
                      ? 'Unavailable'
                      : item.optionGroups.length ? 'Customize' : 'Add to order'} <Plus className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-stone-700 bg-[#1A1814] p-10 text-center">
            <Coffee className="mx-auto h-8 w-8 text-stone-500" />
            <p className="mt-3 font-medium">No menu items found</p>
            <p className="mt-1 text-sm text-stone-400">Try a different search or category.</p>
          </div>
        )}
      </main>

      {cartCount > 0 && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="fixed inset-x-4 bottom-4 z-20 flex items-center justify-between rounded-2xl bg-[#C6A269] px-5 py-4 font-semibold text-[#1A1814] shadow-xl sm:hidden"
        >
          <span>{cartCount} item{cartCount === 1 ? '' : 's'} · {inr.format(subtotal)}</span>
          <span className="inline-flex items-center gap-2">View cart <ArrowRight className="h-4 w-4" /></span>
        </button>
      )}

      {notice && <div role="status" className="fixed bottom-5 left-1/2 z-50 -transtone-x-1/2 rounded-xl border border-[#B8955C]/25 bg-[#1A1814] px-4 py-3 text-sm text-[#D6C29D] shadow-xl">{notice}</div>}

      {selectedItem && (
        <CustomizeDialog
          item={selectedItem}
          onClose={() => { setSelectedItem(null); setEditingCartKey(null) }}
          initialSelections={editingCartKey ? cart.find((line) => line.key === editingCartKey)?.selections : undefined}
          initialQuantity={editingCartKey ? cart.find((line) => line.key === editingCartKey)?.quantity : undefined}
          onAdd={saveCustomization}
        />
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/65" onClick={() => setCartOpen(false)}>
          <aside
            className="h-full w-full max-w-lg overflow-y-auto border-l border-stone-700 bg-[#1A1814] p-5 sm:p-6"
            onClick={(event) => event.stopPropagation()}
            aria-label="Shopping cart"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs tracking-[0.2em] text-stone-400 uppercase">Your order</p>
                <h2 className="mt-1 text-xl font-semibold">Shopping cart</h2>
              </div>
              <button type="button" onClick={() => setCartOpen(false)} aria-label="Close cart" className="rounded-lg border border-stone-700 p-2 text-stone-300 hover:bg-[#12110F]"><X className="h-4 w-4" /></button>
            </div>
            {cart.length === 0 ? (
              <div className="mt-16 text-center">
                <ShoppingBag className="mx-auto h-9 w-9 text-stone-500" />
                <p className="mt-4 font-medium">Your cart is empty</p>
                <p className="mt-1 text-sm text-stone-400">Add a café favourite to get started.</p>
              </div>
            ) : (
              <>
                <div className="mt-6 space-y-3">
                  {cart.map((line) => (
                    <div key={line.key} className="rounded-xl border border-stone-700 bg-[#12110F] p-3">
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{line.item.name}</p>
                          <p className="mt-1 text-xs text-stone-400">{Object.entries(line.selections).map(([label, value]) => `${label}: ${value}`).join(' · ')}</p>
                        </div>
                        <p className="text-sm font-semibold text-stone-200">{inr.format(getUnitPrice(line) * line.quantity)}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 rounded-lg border border-stone-700">
                          <button type="button" onClick={() => updateQuantity(line.key, line.quantity - 1)} aria-label={`Decrease ${line.item.name} quantity`} className="p-2 hover:text-[#F4EFE6]"><Minus className="h-3.5 w-3.5" /></button>
                          <span className="min-w-4 text-center text-sm">{line.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(line.key, line.quantity + 1)} aria-label={`Increase ${line.item.name} quantity`} className="p-2 hover:text-[#F4EFE6]"><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => { setEditingCartKey(line.key); setSelectedItem(line.item); setCartOpen(false) }} className="text-xs text-[#D6C29D] hover:text-[#E5D6B7]">Edit</button>
                          <button type="button" onClick={() => updateQuantity(line.key, 0)} className="inline-flex items-center gap-1 text-xs text-rose-300 hover:text-rose-200"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
                        </div>
                      </div>
                      {(!line.item.available || unavailableMenuItems.includes(line.item.name)) && (
                        <p className="mt-2 rounded-lg bg-rose-500/10 p-2 text-xs text-rose-200">This item is now unavailable in the demo stock state. Remove it before checkout.</p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-6 space-y-3 border-t border-stone-700 pt-4 text-sm">
                  <div className="flex justify-between text-stone-300"><span>Estimated subtotal</span><span>{inr.format(subtotal)}</span></div>
                  <div className="flex justify-between text-stone-300"><span>Estimated tax (5%)</span><span>{inr.format(estimatedTax)}</span></div>
                  <div className="flex justify-between text-base font-semibold text-[#F4EFE6]"><span>Estimated total</span><span>{inr.format(subtotal + estimatedTax)}</span></div>
                  <p className="text-xs leading-5 text-[#D6C29D]/80">Estimate only. Final price, tax, and availability must be confirmed by the backend. The current order API calculates a total from submitted item prices and does not support configured tax or menu-price validation.</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setCheckoutError(''); setCheckoutOpen(true) }}
                  disabled={unavailableCartItems.length > 0}
                  className="mt-5 w-full rounded-xl bg-[#C6A269] px-4 py-3 text-sm font-semibold text-[#1A1814] hover:bg-[#D2B677] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue to checkout
                </button>
              </>
            )}
          </aside>
        </div>
      )}

      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4">
          <form onSubmit={submitOrder} className="my-auto w-full max-w-lg rounded-2xl border border-stone-700 bg-[#1A1814] p-5 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs tracking-[0.2em] text-stone-400 uppercase">Final review</p>
                <h2 className="mt-1 text-xl font-semibold">Checkout</h2>
              </div>
              <button type="button" onClick={() => setCheckoutOpen(false)} aria-label="Close checkout" className="rounded-lg border border-stone-700 p-2 text-stone-300"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-5 space-y-3 rounded-xl border border-stone-700 bg-[#12110F] p-3">
              {cart.map((line) => (
                <div key={line.key} className="flex justify-between gap-3 text-sm">
                  <span className="text-stone-300">{line.quantity} × {line.item.name}</span>
                  <span>{inr.format(getUnitPrice(line) * line.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-stone-700 pt-3 font-semibold"><span>Estimated total</span><span>{inr.format(subtotal + estimatedTax)}</span></div>
            </div>
            <label className="mt-4 block text-sm text-stone-300">
              Name for the order
              <input name="displayName" required maxLength={80} autoComplete="name" className="mt-1.5 h-11 w-full rounded-xl border border-stone-700 bg-[#12110F] px-3 text-[#F4EFE6] outline-none focus:border-[#C6A269]" />
            </label>
            <label className="mt-4 block text-sm text-stone-300">
              How would you like your order?
              <select name="fulfillment" className="mt-1.5 h-11 w-full rounded-xl border border-stone-700 bg-[#12110F] px-3 text-[#F4EFE6] outline-none">
                <option>Pickup</option>
                <option>Takeaway</option>
                <option>Dine-in</option>
              </select>
            </label>
            <p className="mt-3 rounded-xl border border-[#B8955C]/25 bg-[#B8955C]/5 p-3 text-xs leading-5 text-[#E5D6B7]">
              Current backend accepts item names, quantities, and submitted prices only. It cannot record the name, fulfillment choice, verified menu pricing, or taxes. A returned order is confirmed by the backend, but these extra checkout details are not sent or saved.
            </p>
            {checkoutError && <p role="alert" className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{checkoutError}</p>}
            <button type="submit" disabled={submitting || cart.length === 0} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#C6A269] px-4 py-3 font-semibold text-[#1A1814] disabled:cursor-wait disabled:opacity-60">
              {submitting ? 'Submitting order…' : 'Place order with BR CAFÉ'}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>
            <p className="mt-2 text-center text-[11px] text-stone-500">The order is confirmed only when the BR CAFÉ order API accepts it.</p>
          </form>
        </div>
      )}
    </div>
  )
}

function CustomizeDialog({
  item,
  onClose,
  onAdd,
  initialSelections,
  initialQuantity,
}: {
  item: MenuItem
  onClose: () => void
  onAdd: (item: MenuItem, quantity: number, selections: Record<string, string>) => void
  initialSelections?: Record<string, string>
  initialQuantity?: number
}) {
  const [selections, setSelections] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      item.optionGroups.map((group) => [
        group.label,
        initialSelections?.[group.label] ?? group.options[0]?.name ?? '',
      ]),
    ),
  )
  const [quantity, setQuantity] = useState(initialQuantity ?? 1)
  const unitPrice =
    item.price +
    item.optionGroups.reduce((sum, group) => {
      const option = group.options.find((entry) => entry.name === selections[group.label])
      return sum + (option?.price ?? 0)
    }, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4">
      <section className="my-auto w-full max-w-xl overflow-hidden rounded-2xl border border-stone-700 bg-[#1A1814]">
        <div className="relative">
          <img src={item.image} alt={item.name} className="h-48 w-full object-cover" />
          <button type="button" onClick={onClose} aria-label="Close item customizations" className="absolute right-3 top-3 rounded-full bg-[#0D0C0A]/80 p-2 text-[#F4EFE6]"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div><h2 className="text-xl font-semibold">{item.name}</h2><p className="mt-1 text-sm text-stone-400">{item.description}</p></div>
            <span className="font-semibold text-[#C6A269]">{inr.format(unitPrice)}</span>
          </div>
          {item.optionGroups.map((group) => (
            <fieldset key={group.label} className="mt-5">
              <legend className="mb-2 text-sm font-medium text-stone-200">{group.label}{group.required && <span className="text-rose-300"> *</span>}</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {group.options.map((option) => (
                  <label key={option.name} className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 text-sm ${selections[group.label] === option.name ? 'border-[#C6A269]/70 bg-[#C6A269]/10' : 'border-stone-700 bg-[#12110F]'} ${!option.available ? 'cursor-not-allowed opacity-40' : ''}`}>
                    <span className="flex items-center gap-2">
                      <input type="radio" name={`${item.id}-${group.label}`} checked={selections[group.label] === option.name} disabled={!option.available} onChange={() => setSelections({ ...selections, [group.label]: option.name })} />
                      {option.name}
                    </span>
                    {option.price > 0 && <span className="text-xs text-stone-400">+{inr.format(option.price)}</span>}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <div className="mt-5 flex items-center justify-between border-t border-stone-700 pt-4">
            <div className="inline-flex items-center gap-3 rounded-xl border border-stone-700">
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity" className="p-2"><Minus className="h-4 w-4" /></button>
              <span>{quantity}</span>
              <button type="button" onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity" className="p-2"><Plus className="h-4 w-4" /></button>
            </div>
            <button type="button" onClick={() => onAdd(item, quantity, selections)} className="inline-flex items-center gap-2 rounded-xl bg-[#C6A269] px-4 py-2.5 text-sm font-semibold text-[#1A1814] hover:bg-[#D2B677]">
              Add · {inr.format(unitPrice * quantity)} <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

function CustomerTrackingPage() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order')
  const [receipt] = useState<CustomerReceipt | null>(() => {
    try {
      const saved = window.sessionStorage.getItem(TRACKING_KEY)
      if (!saved) return null
      const parsed = JSON.parse(saved) as CustomerReceipt
      return parsed.order.external_id === orderId ? parsed : null
    } catch {
      return null
    }
  })
  const order = receipt?.order
  const orderStatus = order?.status === 'pending' ? 'queued' : order?.status

  return (
    <div className="min-h-screen bg-[#0D0C0A] px-4 py-8 text-stone-100 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Link to="/order" className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-[#F4EFE6]"><ArrowLeft className="h-4 w-4" /> Back to menu</Link>
        <div className="mt-6 rounded-3xl border border-stone-700 bg-[#1A1814] p-6 sm:p-8">
          {order && receipt ? (
            <>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#B8955C]/10 text-[#D6C29D]"><Check className="h-6 w-6" /></div>
              <p className="text-xs tracking-[0.22em] text-[#D6C29D] uppercase">Confirmed by order service</p>
              <h1 className="mt-2 text-3xl font-semibold">Thank you, {receipt.displayName}</h1>
              <div className="mt-5 rounded-2xl border border-stone-700 bg-[#12110F] p-4">
                <p className="text-xs text-stone-400">Order number</p>
                <p className="mt-1 text-xl font-semibold text-[#C6A269]">{order.external_id}</p>
                <p className="mt-2 text-xs text-stone-400">Backend record #{order.id} · Submitted {new Date(order.placed_at).toLocaleString()}</p>
              </div>
              <div className="mt-5 flex items-center justify-between gap-4">
                <div><p className="text-xs text-stone-400">Current status from confirmation</p><p className="mt-1 text-lg font-medium capitalize">{orderStatus}</p></div>
                <div className="text-right"><p className="text-xs text-stone-400">Promised by</p><p className="mt-1 text-lg font-medium">{new Date(order.promised_by).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p></div>
              </div>
              <div className="mt-5 space-y-2">
                {order.items.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="flex justify-between rounded-xl border border-stone-700 bg-[#12110F] p-3 text-sm">
                    <span className="text-stone-300">{item.qty} × {item.name}</span>
                    <span>{inr.format(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between border-t border-stone-700 pt-4 font-semibold"><span>Backend order total</span><span>{inr.format(order.total)}</span></div>
              <div className="mt-5 flex items-start gap-2 rounded-xl border border-[#B8955C]/25 bg-[#B8955C]/5 p-3 text-xs leading-5 text-[#E5D6B7]">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                Tracking updates are not available yet: this backend has no customer-authorized tracking endpoint or live status stream. This page shows only the order confirmation returned to this browser session and will not simulate progress.
              </div>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#B8955C]/10 text-[#D6C29D]"><CircleAlert className="h-6 w-6" /></div>
              <h1 className="mt-4 text-2xl font-semibold">Order not available in this browser</h1>
              <p className="mt-2 text-sm leading-6 text-stone-400">For your privacy, this page does not look up an order by a guessable ID. Open tracking from the browser session where the backend confirmed the order.</p>
              <Link to="/order" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#C6A269] px-4 py-2.5 text-sm font-semibold text-[#1A1814]">Return to menu <ArrowRight className="h-4 w-4" /></Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default CustomerOrdering
