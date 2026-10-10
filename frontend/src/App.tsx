import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  ChevronRight,
  Clock3,
  Command,
  Compass,
  Gauge,
  Menu,
  PackageCheck,
  Recycle,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  UserRound,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { format } from 'date-fns'
import CustomerOrdering from './features/CustomerOrdering'
import InventoryPage from './features/InventoryPage'
import { getManagerOrders, type ApiOrder } from './lib/api'

function BrandWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#B88E5D]/40 bg-[#181512] shadow-[0_0_20px_rgba(184,142,93,0.18)]">
        <span className="absolute inset-[9px] rounded-md border border-[#B88E5D]/60" />
        <span className="text-[11px] font-black tracking-[0.16em] text-[#B88E5D]">BR</span>
      </div>
      {!compact && (
        <div>
          <p className="text-[10px] tracking-[0.32em] text-stone-400">BR CAFÉ</p>
          <p className="text-sm font-medium text-stone-100">Mission Control</p>
        </div>
      )}
    </div>
  )
}

const navItems: { label: string; path: string; icon: LucideIcon }[] = [
  { label: 'Mission Control', path: '/', icon: Gauge },
  { label: 'Digital Twin', path: '/digital-twin', icon: Warehouse },
  { label: 'Analytics', path: '/analytics', icon: TrendingUp },
  { label: 'Inventory & Procurement', path: '/inventory', icon: PackageCheck },
  { label: 'WasteLess', path: '/waste', icon: Recycle },
  { label: 'OrderSync', path: '/orders', icon: PackageCheck },
  { label: 'ServiceLedger', path: '/ledger', icon: BriefcaseBusiness },
  { label: 'Rush-Hour Scheduler', path: '/scheduler', icon: Clock3 },
  { label: 'Activity & Events', path: '/activity', icon: Activity },
  { label: 'Settings', path: '/settings', icon: Settings },
]

type StatusTone = 'queued' | 'preparing' | 'ready' | 'delayed' | 'completed' | 'cancelled'

type OrderRecord = {
  id: string
  items: string
  dataSource?: 'demo' | 'api'
  orderType: 'online' | 'in-person'
  channel: string
  priority: 'High' | 'Normal' | 'Low'
  waitingMinutes: number
  station: string
  eta: string
  status: StatusTone
  progress: number
  table: string
  itemsList: { name: string; qty: number; prep: number }[]
  servedItems: string[]
  events: string[]
  dependencies: string[]
}

type Metric = {
  label: string
  value: string
  delta: string
  detail: string
  trend: { type: 'up' | 'down'; data: number[] }
  sentiment: 'good' | 'warn' | 'info'
}

const metrics: Metric[] = [
  {
    label: 'Active Orders',
    value: '184',
    delta: '+12.4%',
    detail: 'vs last 30 min',
    trend: { type: 'up', data: [28, 34, 31, 48, 52, 60, 72] },
    sentiment: 'good',
  },
  {
    label: 'Average Waiting Time',
    value: '8m 42s',
    delta: '-1m 06s',
    detail: 'order-to-ready',
    trend: { type: 'up', data: [80, 75, 72, 68, 62, 57, 52] },
    sentiment: 'info',
  },
  {
    label: 'Kitchen Utilization',
    value: '76%',
    delta: '+4.6%',
    detail: 'peak load',
    trend: { type: 'up', data: [40, 48, 44, 55, 62, 71, 76] },
    sentiment: 'warn',
  },
  {
    label: 'Waste Generated Today',
    value: '31.8kg',
    delta: '-8.7%',
    detail: 'across prep & service',
    trend: { type: 'down', data: [92, 88, 84, 79, 73, 66, 62] },
    sentiment: 'good',
  },
  {
    label: 'Waste Recovery Rate',
    value: '87%',
    delta: '+6.1%',
    detail: 'recycled or composted',
    trend: { type: 'up', data: [52, 58, 61, 66, 70, 78, 87] },
    sentiment: 'good',
  },
  {
    label: 'Total Cost Savings',
    value: '₹2,480',
    delta: '+₹340',
    detail: 'this cycle',
    trend: { type: 'up', data: [18, 24, 30, 38, 45, 53, 62] },
    sentiment: 'good',
  },
]

const orderRows: OrderRecord[] = [
  {
    id: 'BR-2048',
    items: 'Cappuccino ×2, Almond Croissant',
    orderType: 'in-person',
    channel: 'Dine-in',
    priority: 'High',
    waitingMinutes: 6,
    station: 'Barista 01',
    eta: '10:42',
    status: 'preparing',
    progress: 64,
    table: 'T12',
    itemsList: [
      { name: 'Cappuccino', qty: 2, prep: 4 },
      { name: 'Almond Croissant', qty: 1, prep: 6 },
    ],
    servedItems: [],
    events: ['Order received', 'Milk steamed', 'Queue rebalanced'],
    dependencies: ['Espresso Machine', 'Pastry holding'],
  },
  {
    id: 'BR-2056',
    items: 'Matcha Latte, Lemon Soda',
    orderType: 'online',
    channel: 'Website',
    priority: 'Normal',
    waitingMinutes: 11,
    station: 'Barista 02',
    eta: '10:46',
    status: 'queued',
    progress: 18,
    table: 'T09',
    itemsList: [
      { name: 'Matcha Latte', qty: 1, prep: 5 },
      { name: 'Lemon Soda', qty: 1, prep: 3 },
    ],
    servedItems: [],
    events: ['Order queued', 'Waiting for station handoff'],
    dependencies: ['Tea station', 'Fizz line'],
  },
  {
    id: 'BR-2081',
    items: 'Chicken Sourdough, Flat White',
    orderType: 'in-person',
    channel: 'Dine-in',
    priority: 'High',
    waitingMinutes: 19,
    station: 'Assembly',
    eta: '10:58',
    status: 'delayed',
    progress: 42,
    table: 'T18',
    itemsList: [
      { name: 'Chicken Sourdough', qty: 1, prep: 8 },
      { name: 'Flat White', qty: 1, prep: 3 },
    ],
    servedItems: [],
    events: ['Meat prep delayed', 'Station backlog detected'],
    dependencies: ['Grill line', 'Barista handoff'],
  },
  {
    id: 'BR-2103',
    items: 'Signature Breakfast Bowl',
    orderType: 'online',
    channel: 'Swiggy',
    priority: 'Low',
    waitingMinutes: 4,
    station: 'Pickup',
    eta: '10:31',
    status: 'ready',
    progress: 100,
    table: 'Pickup',
    itemsList: [
      { name: 'Signature Breakfast Bowl', qty: 1, prep: 7 },
      { name: 'Orange Juice', qty: 1, prep: 2 },
    ],
    servedItems: [],
    events: ['Prepared', 'Guest notified'],
    dependencies: ['Assembly', 'Pickup lane'],
  },
  {
    id: 'BR-2142',
    items: 'Iced Mocha, Protein Box',
    orderType: 'online',
    channel: 'Zomato',
    priority: 'Normal',
    waitingMinutes: 22,
    station: 'Barista 01',
    eta: '11:04',
    status: 'cancelled',
    progress: 0,
    table: 'T22',
    itemsList: [
      { name: 'Iced Mocha', qty: 1, prep: 5 },
      { name: 'Protein Box', qty: 1, prep: 6 },
    ],
    servedItems: [],
    events: ['Order corrected', 'Customer called'],
    dependencies: ['Cashier escalation'],
  },
]

const scheduleRows = [
  {
    station: 'Barista Station 1',
    tasks: [
      { name: 'Espresso run', start: 8.5, duration: 1.4, color: 'bg-[#A97D52]/75', width: '18%' },
      { name: 'Cold brew refill', start: 11.2, duration: 1.2, color: 'bg-stone-500/70', width: '16%' },
    ],
  },
  {
    station: 'Barista Station 2',
    tasks: [{ name: 'Latte rush', start: 9.1, duration: 2.2, color: 'bg-[#A97D52]/90', width: '24%' }],
  },
  {
    station: 'Espresso Machine',
    tasks: [{ name: 'Shot cycle', start: 8.8, duration: 3.1, color: 'bg-[#A97D52]/75', width: '31%' }],
  },
  {
    station: 'Steamer',
    tasks: [{ name: 'Milk prep', start: 9.7, duration: 2.2, color: 'bg-[#A97D52]/90', width: '22%' }],
  },
  {
    station: 'Assembly Counter',
    tasks: [{ name: 'Sandwich line', start: 10.1, duration: 2.7, color: 'bg-rose-500/90', width: '29%' }],
  },
  {
    station: 'Pickup',
    tasks: [{ name: 'Guest handoff', start: 10.8, duration: 1.6, color: 'bg-stone-500/70', width: '20%' }],
  },
]

const alerts = [
  { severity: 'High', title: 'Station delay', description: 'Assembly counter running 14 min behind due to sandwich reload.', time: '2m ago', action: 'Inspect' },
  { severity: 'Medium', title: 'Orders at risk', description: '4 orders are expected to miss target SLA before 11:00.', time: '5m ago', action: 'Review' },
  { severity: 'Low', title: 'Inventory warning', description: 'Oat milk is at 3 L; the configured low-stock trigger is 6 L.', time: '8m ago', action: 'Acknowledge' },
  { severity: 'High', title: 'Critical ingredient', description: 'Paneer is out of stock in the demo inventory and may affect four menu items.', time: 'Just now', action: 'Inspect inventory' },
  { severity: 'Medium', title: 'Correction pending', description: 'Service ledger correction for BR-2142 requires approval.', time: '14m ago', action: 'Resolve' },
  { severity: 'High', title: 'Waste container', description: 'Compost bin is 82% full; collection is scheduled.', time: '18m ago', action: 'Inspect' },
]

const activityFeed = [
  { type: 'Order received', detail: 'BR-2154 added from website', link: 'Order #BR-2154', time: '2 min ago' },
  { type: 'Schedule recalculated', detail: 'Rush-hour model rebalanced all barista lanes', link: 'Scheduler', time: '7 min ago' },
  { type: 'Station delay detected', detail: 'Espresso queue grew by 7 orders in 4 minutes', link: 'Station Live', time: '11 min ago' },
  { type: 'Correction recorded', detail: 'Manual adjustment applied to BR-2142', link: 'Correction record', time: '17 min ago' },
  { type: 'Waste batch collected', detail: 'Compost run 5 cleared from prep station', link: 'WasteLot 5', time: '22 min ago' },
]

const chartData = [
  { name: '08:00', orders: 54, waste: 28, recovery: 68 },
  { name: '09:00', orders: 68, waste: 26, recovery: 72 },
  { name: '10:00', orders: 78, waste: 40, recovery: 78 },
  { name: '11:00', orders: 96, waste: 44, recovery: 81 },
  { name: '12:00', orders: 88, waste: 39, recovery: 84 },
  { name: '13:00', orders: 92, waste: 31, recovery: 86 },
]

const supportChartData = [
  { name: 'Mon', sales: 2800, waste: 120 },
  { name: 'Tue', sales: 3200, waste: 140 },
  { name: 'Wed', sales: 3460, waste: 138 },
  { name: 'Thu', sales: 3720, waste: 152 },
  { name: 'Fri', sales: 3900, waste: 165 },
  { name: 'Sat', sales: 4400, waste: 182 },
]

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/order/*" element={<CustomerOrdering />} />
        <Route path="*" element={<AppShell />} />
      </Routes>
    </BrowserRouter>
  )
}

function mapApiOrder(order: ApiOrder): OrderRecord {
  const statuses: Record<ApiOrder['status'], StatusTone> = {
    pending: 'queued',
    preparing: 'preparing',
    ready: 'ready',
    completed: 'completed',
    cancelled: 'cancelled',
  }
  const promisedBy = new Date(order.promised_by)
  const placedAt = new Date(order.placed_at)
  const elapsedMinutes = Number.isNaN(placedAt.getTime())
    ? 0
    : Math.max(0, Math.round((Date.now() - placedAt.getTime()) / 60000))

  return {
    id: order.external_id,
    items: order.items.map((item) => `${item.name} ×${item.qty}`).join(', '),
    dataSource: 'api',
    orderType: ['pos', 'counter', 'dine-in'].includes(order.source) ? 'in-person' : 'online',
    channel: order.source,
    priority: 'Normal',
    waitingMinutes: elapsedMinutes,
    station: 'Unassigned',
    eta: Number.isNaN(promisedBy.getTime()) ? 'Pending' : format(promisedBy, 'HH:mm'),
    status: statuses[order.status],
    progress: order.status === 'ready' || order.status === 'completed' ? 100 : order.status === 'preparing' ? 50 : 0,
    table: 'Not supplied',
    itemsList: order.items.map((item) => ({
      name: item.name,
      qty: item.qty,
      prep: item.prep_minutes ?? 0,
    })),
    servedItems: [],
    events: [`Loaded from order API · ${order.status}`],
    dependencies: [],
  }
}

function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null)
  const [orders, setOrders] = useState<OrderRecord[]>(orderRows)
  const [orderSyncError, setOrderSyncError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'waiting' | 'priority' | 'eta'>('waiting')
  const [isPlaying, setIsPlaying] = useState(true)
  const [timelineCursor, setTimelineCursor] = useState(10.2)
  const [zoomLevel, setZoomLevel] = useState(1)

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 60000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let active = true
    const refresh = async () => {
      try {
        const apiOrders = await getManagerOrders()
        if (!active) return
        setOrderSyncError('')
        setOrders((current) => {
          const merged = new Map(current.map((order) => [order.id, order]))
          apiOrders.forEach((order) => merged.set(order.external_id, mapApiOrder(order)))
          return [...merged.values()]
        })
      } catch (error) {
        if (active) {
          setOrderSyncError(error instanceof Error ? error.message : 'Unable to refresh from the order API.')
        }
      }
    }
    void refresh()
    const timer = window.setInterval(() => void refresh(), 20000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    if (!isPlaying) return
    const timer = window.setInterval(() => {
      setTimelineCursor((prev) => (prev >= 12.8 ? 8.2 : prev + 0.15))
    }, 900)
    return () => window.clearInterval(timer)
  }, [isPlaying])

  useEffect(() => {
    const keyHandler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen(true)
      }
      if (event.key === 'Escape') {
        setPaletteOpen(false)
      }
    }
    window.addEventListener('keydown', keyHandler)
    return () => window.removeEventListener('keydown', keyHandler)
  }, [])

  const filteredOrders = useMemo(() => {
    const filtered = orders.filter((order) => {
      const matchesSearch =
        !search ||
        order.id.toLowerCase().includes(search.toLowerCase()) ||
        order.items.toLowerCase().includes(search.toLowerCase()) ||
        order.station.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter
      return matchesSearch && matchesStatus
    })

    return [...filtered].sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { High: 3, Normal: 2, Low: 1 }
        return (priorityOrder[b.priority] ?? 0) - (priorityOrder[a.priority] ?? 0)
      }

      if (sortBy === 'eta') {
        return a.eta.localeCompare(b.eta)
      }

      return b.waitingMinutes - a.waitingMinutes
    })
  }, [orders, search, statusFilter, sortBy])

  const updateOrder = (orderId: string, update: (order: OrderRecord) => OrderRecord) => {
    setOrders((currentOrders) =>
      currentOrders.map((order) => (order.id === orderId ? update(order) : order)),
    )
    setSelectedOrder((currentOrder) =>
      currentOrder?.id === orderId ? update(currentOrder) : currentOrder,
    )
  }

  const markOrderReady = (orderId: string) => {
    updateOrder(orderId, (order) => ({
      ...order,
      status: 'ready',
      progress: 100,
      events: [...order.events, 'All items marked ready for handoff'],
    }))
  }

  const serveOrder = (orderId: string, itemName?: string) => {
    updateOrder(orderId, (order) => {
      if (order.status !== 'ready' || order.orderType === 'online') return order

      const servedItems = itemName
        ? [...new Set([...order.servedItems, itemName])]
        : order.servedItems
      const event = itemName ? `${itemName} served to guest` : 'Items served'

      return {
        ...order,
        servedItems,
        events: [...order.events, event],
        ...(servedItems.length === order.itemsList.length
          ? { status: 'completed' as const }
          : {}),
      }
    })
  }

  const handoffOnlineOrder = (orderId: string) => {
    updateOrder(orderId, (order) => {
      if (order.status !== 'ready' || order.orderType !== 'online') return order

      return {
        ...order,
        servedItems: order.itemsList.map((item) => item.name),
        status: 'completed',
        events: [...order.events, 'Complete order handed off together'],
      }
    })
  }

  const pageMeta = {
    '/': 'Mission Control',
    '/digital-twin': 'Digital Twin',
    '/analytics': 'Analytics',
    '/inventory': 'Inventory & Procurement',
    '/waste': 'WasteLess',
    '/orders': 'OrderSync',
    '/ledger': 'ServiceLedger',
    '/scheduler': 'Rush-Hour Scheduler',
    '/activity': 'Activity & Events',
    '/settings': 'Settings',
  } as const

  return (
    <div className="min-h-screen bg-[#0D0B09] text-stone-100">
      <div className="flex min-h-screen">
        <aside
          className={`${
            sidebarOpen ? 'w-[220px]' : 'w-[88px]'
          } border-r border-stone-700/80 bg-[#11100E] px-3 py-5 transition-all duration-300`}
        >
          <div className="mb-8 overflow-hidden px-2">
            {sidebarOpen ? <BrandWordmark /> : <BrandWordmark compact />}
          </div>

          <nav className="space-y-1">
            {navItems.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-[#181512] text-[#F5F0EA] shadow-[inset_0_0_0_1px_rgba(184,142,93,0.3)]'
                      : 'text-stone-300 hover:bg-[#181512]/60 hover:text-stone-100'
                  } ${sidebarOpen ? '' : 'justify-center px-0'}`
                }
              >
                <Icon className="h-4 w-4" />
                {sidebarOpen && <span>{label}</span>}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="flex-1">
          <header className="border-b border-stone-700/80 bg-[#11100E]/90 px-5 py-3 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen((prev) => !prev)}
                  className="rounded-lg border border-stone-700 bg-[#181512] p-2 text-stone-300 hover:text-[#F5F0EA]"
                  aria-label="Toggle sidebar"
                >
                  <Menu className="h-4 w-4" />
                </button>
                <div>
                  <p className="text-[10px] tracking-[0.22em] text-stone-400 uppercase">Operations</p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-stone-200">
                    <span>{pageMeta[(location.pathname as keyof typeof pageMeta) || '/']}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-stone-500" />
                    <span className="text-stone-400">Downtown</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-1 items-center justify-end gap-3">
                <button className="flex items-center gap-2 rounded-xl border border-stone-700 bg-[#181512] px-3 py-2 text-sm text-stone-200">
                  <Compass className="h-4 w-4 text-[#B88E5D]" />
                  BR Café — Downtown
                </button>
                <Link to="/order" className="hidden items-center gap-2 rounded-xl border border-[#B88E5D]/30 bg-[#B88E5D]/10 px-3 py-2 text-sm text-[#D5B78B] hover:bg-[#B88E5D]/15 lg:inline-flex">
                  Customer order page
                </Link>
                <div className="flex items-center gap-2 rounded-xl border border-[#A97D52]/25 bg-[#A97D52]/10 px-2.5 py-2 text-xs text-[#B88E5D]">
                  <span className="h-2 w-2 rounded-full bg-[#B88E5D]" />
                  Demo snapshot
                </div>
                <div className="hidden items-center gap-2 rounded-xl border border-stone-700 bg-[#181512] px-3 py-2 text-sm text-stone-300 md:flex">
                  <Clock3 className="h-4 w-4 text-stone-400" />
                  {format(currentTime, 'EEE, MMM d')} · {format(currentTime, 'p')}
                </div>

                <button
                  type="button"
                  onClick={() => setPaletteOpen(true)}
                  className="flex items-center gap-2 rounded-xl border border-stone-700 bg-[#181512] px-3 py-2 text-sm text-stone-200"
                >
                  <Search className="h-4 w-4 text-stone-400" />
                  <span className="hidden md:inline">Search</span>
                  <span className="hidden rounded-md border border-stone-600 bg-[#11100E] px-1.5 py-0.5 text-[10px] text-stone-300 md:inline">
                    ⌘K
                  </span>
                </button>

                <button className="relative rounded-xl border border-stone-700 bg-[#181512] p-2.5 text-stone-200">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#F87171] text-[10px] font-semibold text-[#F5F0EA]">
                    6
                  </span>
                </button>

                <button className="flex items-center gap-2 rounded-xl border border-stone-700 bg-[#181512] px-2 py-2 text-left text-stone-200">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#B5A38B]/20 text-[#B5A38B]">
                    <UserRound className="h-4 w-4" />
                  </div>
                  <div className="hidden md:block">
                    <p className="text-xs text-stone-400">Shift lead</p>
                    <p className="text-sm font-medium">Maya Patel</p>
                  </div>
                </button>
              </div>
            </div>
          </header>

          <main className="p-5">
            <Routes>
              <Route path="/" element={<MissionControlPage selectedOrder={selectedOrder} setSelectedOrder={setSelectedOrder} search={search} setSearch={setSearch} statusFilter={statusFilter} setStatusFilter={setStatusFilter} sortBy={sortBy} setSortBy={setSortBy} filteredOrders={filteredOrders} isPlaying={isPlaying} setIsPlaying={setIsPlaying} timelineCursor={timelineCursor} setTimelineCursor={setTimelineCursor} zoomLevel={zoomLevel} setZoomLevel={setZoomLevel} onMarkReady={markOrderReady} onServeItem={(orderId, itemName) => serveOrder(orderId, itemName)} onHandoffOnlineOrder={handoffOnlineOrder} />} />
              <Route path="/digital-twin" element={<DigitalTwinPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/waste" element={<WasteLessPage />} />
              <Route path="/orders" element={<OrderSyncPage orders={orders} />} />
              <Route path="/ledger" element={<ServiceLedgerPage />} />
              <Route path="/scheduler" element={<RushSchedulerPage />} />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
            {orderSyncError && (
              <div role="status" className="mt-4 rounded-xl border border-[#A97D52]/25 bg-[#A97D52]/5 p-3 text-xs text-[#DCC39F]">
                Order API refresh unavailable: {orderSyncError}. The preloaded manager queue remains demo data; customer orders will appear here when the backend is reachable.
              </div>
            )}
          </main>
        </div>
      </div>

      <AnimatePresence>
        {paletteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-[#0D0B09]/75 p-6 pt-28"
            onClick={() => setPaletteOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-xl rounded-2xl border border-stone-700 bg-[#181512] p-3 shadow-2xl"
            >
              <div className="flex items-center gap-3 rounded-xl border border-stone-700 bg-[#11100E] px-3 py-2">
                <Search className="h-4 w-4 text-stone-400" />
                <input
                  autoFocus
                  placeholder="Search all systems"
                  className="w-full bg-transparent text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none"
                />
                <span className="rounded-md border border-stone-600 bg-[#11100E] px-1.5 py-0.5 text-[10px] text-stone-300">Esc</span>
              </div>
              <div className="mt-3 space-y-1">
                {navItems.map(({ label, path, icon: Icon }) => (
                  <button
                    key={path}
                    type="button"
                    onClick={() => {
                      navigate(path)
                      setPaletteOpen(false)
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-stone-200 hover:bg-[#201D1A]"
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-[#B88E5D]" />
                      {label}
                    </span>
                    <Command className="h-3.5 w-3.5 text-stone-500" />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MissionControlPage({
  selectedOrder,
  setSelectedOrder,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  filteredOrders,
  isPlaying,
  setIsPlaying,
  timelineCursor,
  setTimelineCursor,
  zoomLevel,
  setZoomLevel,
  onMarkReady,
  onServeItem,
  onHandoffOnlineOrder,
}: {
  selectedOrder: OrderRecord | null
  setSelectedOrder: (order: OrderRecord | null) => void
  search: string
  setSearch: (value: string) => void
  statusFilter: string
  setStatusFilter: (value: string) => void
  sortBy: 'waiting' | 'priority' | 'eta'
  setSortBy: (value: 'waiting' | 'priority' | 'eta') => void
  filteredOrders: OrderRecord[]
  isPlaying: boolean
  setIsPlaying: (value: boolean) => void
  timelineCursor: number
  setTimelineCursor: (value: number) => void
  zoomLevel: number
  setZoomLevel: (value: number) => void
  onMarkReady: (orderId: string) => void
  onServeItem: (orderId: string, itemName: string) => void
  onHandoffOnlineOrder: (orderId: string) => void
}) {
  const navigate = useNavigate()
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<string[]>([])

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-6">
        {metrics.map((metric, index) => (
          <MetricCard key={metric.label} metric={metric} index={index} />
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_0.9fr]">
        <section className="rounded-2xl border border-stone-700 bg-[#181512] p-4 shadow-[0_10px_40px_rgba(0,0,0,0.24)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] tracking-[0.26em] text-stone-400 uppercase">Queue</p>
              <h3 className="mt-1 text-lg font-semibold text-stone-100">Live Order Queue</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search orders"
                className="h-10 rounded-xl border border-stone-700 bg-[#11100E] px-3 text-sm text-stone-200 placeholder:text-stone-500 focus:outline-none"
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-10 rounded-xl border border-stone-700 bg-[#11100E] px-3 text-sm text-stone-200 focus:outline-none"
              >
                <option value="all">All</option>
                <option value="queued">Queued</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="delayed">Delayed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as 'waiting' | 'priority' | 'eta')}
                className="h-10 rounded-xl border border-stone-700 bg-[#11100E] px-3 text-sm text-stone-200 focus:outline-none"
              >
                <option value="waiting">Sort: wait time</option>
                <option value="priority">Sort: priority</option>
                <option value="eta">Sort: ETA</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-700 text-stone-400">
                  <th className="pb-3 font-medium">Order ID</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Items</th>
                  <th className="pb-3 font-medium">Priority</th>
                  <th className="pb-3 font-medium">Waiting</th>
                  <th className="pb-3 font-medium">Station</th>
                  <th className="pb-3 font-medium">ETA</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="cursor-pointer border-b border-stone-800/80 transition hover:bg-[#201D1A]"
                  >
                    <td className="py-3 font-medium text-stone-100">{order.id}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${order.orderType === 'online' ? 'bg-stone-500/10 text-stone-200' : 'bg-stone-500/15 text-stone-200'}`}>
                        {order.orderType === 'online' ? `Online · ${order.channel}` : 'In person'}
                      </span>
                    </td>
                    <td className="py-3 text-stone-300">{order.items}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${priorityTone(order.priority)}`}>
                        {order.priority}
                      </span>
                    </td>
                    <td className="py-3 text-stone-300">{order.waitingMinutes} min</td>
                    <td className="py-3 text-stone-300">{order.station}</td>
                    <td className="py-3 text-stone-300">{order.eta}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${statusTone(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="rounded-2xl border border-stone-700 bg-[#181512] p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] tracking-[0.26em] text-stone-400 uppercase">Incidents</p>
              <h3 className="mt-1 text-lg font-semibold text-stone-100">Alerts & Incidents</h3>
            </div>
            <button className="text-sm text-[#B88E5D] hover:text-[#B88E5D]">View all</button>
          </div>
          <div className="space-y-3">
            {alerts.filter((alert) => !acknowledgedAlerts.includes(alert.title)).map((alert) => (
              <div key={alert.title} className="rounded-xl border border-stone-700 bg-[#11100E] p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${severityTone(alert.severity)}`}>
                    {alert.severity}
                  </span>
                  <span className="text-[10px] text-stone-400">{alert.time}</span>
                </div>
                <p className="text-sm font-medium text-stone-100">{alert.title}</p>
                <p className="mt-1 text-xs leading-5 text-stone-400">{alert.description}</p>
                <button
                  type="button"
                  onClick={() => {
                    if (alert.title === 'Critical ingredient') {
                      navigate('/inventory')
                    } else {
                      setAcknowledgedAlerts((current) => [...current, alert.title])
                    }
                  }}
                  className="mt-2 text-xs font-medium text-[#B88E5D] hover:text-[#B88E5D]"
                >
                  {alert.action}
                </button>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-2xl border border-stone-700 bg-[#181512] p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] tracking-[0.26em] text-stone-400 uppercase">Plan</p>
              <h3 className="mt-1 text-lg font-semibold text-stone-100">Kitchen Scheduling Timeline</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="rounded-lg border border-stone-700 bg-[#11100E] px-2.5 py-1.5 text-xs text-stone-200 hover:border-stone-500"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button
                type="button"
                onClick={() => setTimelineCursor(9.2)}
                className="rounded-lg border border-stone-700 bg-[#11100E] px-2.5 py-1.5 text-xs text-stone-200 hover:border-stone-500"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(zoomLevel >= 1.4 ? 1 : Number((zoomLevel + 0.2).toFixed(1)))}
                className="rounded-lg border border-stone-700 bg-[#11100E] px-2.5 py-1.5 text-xs text-stone-200 hover:border-stone-500"
              >
                Zoom {zoomLevel.toFixed(1)}x
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-[160px_1fr] gap-4 text-[11px] text-stone-400">
              <span></span>
              <div className="grid grid-cols-6 text-center">
                {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00'].map((time) => (
                  <span key={time}>{time}</span>
                ))}
              </div>
            </div>

            {scheduleRows.map((row) => (
              <div key={row.station} className="grid grid-cols-[160px_1fr] gap-4 items-center">
                <div className="text-sm text-stone-300">{row.station}</div>
                <div className="relative h-11 overflow-hidden rounded-xl border border-stone-700 bg-[#11100E]">
                  <div className="absolute inset-0 grid grid-cols-6">
                    {[...Array(6)].map((_, idx) => (
                      <div key={idx} className="border-r border-stone-800 last:border-r-0" />
                    ))}
                  </div>
                  <div
                    className="absolute inset-y-0 w-px bg-[#B88E5D]/80"
                    style={{ left: `${((timelineCursor - 8) / 5.6) * 100}%` }}
                  />
                  {row.tasks.map((task) => (
                    <button
                      key={task.name}
                      type="button"
                      className={`absolute top-1.5 flex h-8 items-center justify-center overflow-hidden rounded-md border border-white/10 px-2 text-[10px] font-medium text-[#F5F0EA] ${task.color}`}
                      style={{
                        left: `${(task.start - 8) * 12 * zoomLevel}%`,
                        width: `${parseFloat(task.width) * zoomLevel}%`,
                      }}
                    >
                      {task.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-stone-700 bg-[#181512] p-4">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] tracking-[0.26em] text-stone-400 uppercase">Activity</p>
              <h3 className="mt-1 text-lg font-semibold text-stone-100">Recent Activity</h3>
            </div>
          </div>
          <div className="space-y-3">
            {activityFeed.map((item) => (
              <div key={item.link} className="rounded-xl border border-stone-700 bg-[#11100E] p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-[#B88E5D]">{item.type}</span>
                  <span className="text-[10px] text-stone-400">{item.time}</span>
                </div>
                <p className="mt-2 text-sm text-stone-200">{item.detail}</p>
                <button className="mt-2 text-xs text-[#B88E5D] hover:text-[#B88E5D]">{item.link}</button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-stone-700 bg-[#181512] p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-[0.26em] text-stone-400 uppercase">Digital Twin</p>
            <h3 className="mt-1 text-lg font-semibold text-stone-100">Kitchen & Dining Floor</h3>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg border border-stone-700 bg-[#11100E] px-3 py-2 text-sm text-stone-200">
            Open full model
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>

        <div className="relative h-[280px] overflow-hidden rounded-2xl border border-stone-700 bg-[radial-gradient(circle_at_top,_rgba(184,142,93,0.08),_rgba(13,12,10,0)_45%),linear-gradient(180deg,#11100E,#171311)] p-5">
          <div className="absolute left-10 top-6 h-20 w-28 rounded-xl border border-[#A97D52]/25 bg-[#A97D52]/10 p-3">
            <p className="text-[10px] tracking-[0.22em] text-[#D0B68A] uppercase">Bar 01</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] text-stone-300">
              {[1,2,3].map((n) => (
                <div key={n} className="h-3 rounded-full bg-[#B88E5D]/70" />
              ))}
            </div>
          </div>
          <div className="absolute left-[30%] top-10 h-24 w-40 rounded-xl border border-[#A97D52]/30 bg-[#A97D52]/10 p-3">
            <p className="text-[10px] tracking-[0.22em] text-[#D0B68A] uppercase">Prep</p>
            <div className="mt-4 flex justify-between">
              <div className="h-12 w-16 rounded-lg border border-[#B88E5D]/40 bg-[#B88E5D]/20" />
              <div className="h-12 w-16 rounded-lg border border-stone-300/40 bg-stone-400/20" />
            </div>
          </div>
          <div className="absolute right-12 top-14 h-20 w-28 rounded-xl border border-[#A97D52]/40 bg-[#A97D52]/10 p-3">
            <p className="text-[10px] tracking-[0.22em] text-[#D0B68A] uppercase">Pickup</p>
            <div className="mt-4 flex gap-2">
              {[1,2,3].map((n) => (
                <div key={n} className="h-7 w-7 rounded-full border border-[#B88E5D]/50 bg-[#B88E5D]/20" />
              ))}
            </div>
          </div>
          <div className="absolute inset-x-16 bottom-8 h-24 rounded-2xl border border-stone-700 bg-[#181512]/70 p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-stone-400">
              <span>Dining floor</span>
              <span>Table load</span>
            </div>
            <div className="grid grid-cols-7 gap-3">
              {['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07'].map((table, index) => (
                <div key={table} className={`h-10 rounded-xl border ${index % 2 === 0 ? 'border-[#A97D52]/20 bg-[#A97D52]/10' : 'border-[#A97D52]/25 bg-[#A97D52]/10'} flex items-center justify-center text-[10px] text-stone-200`}>
                  {table}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {selectedOrder ? (
        <OrderDrawer
          selectedOrder={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onMarkReady={() => onMarkReady(selectedOrder.id)}
          onServeItem={(itemName) => onServeItem(selectedOrder.id, itemName)}
          onHandoffOnlineOrder={() => onHandoffOnlineOrder(selectedOrder.id)}
        />
      ) : null}
    </div>
  )
}

function OrderDrawer({
  selectedOrder,
  onClose,
  onMarkReady,
  onServeItem,
  onHandoffOnlineOrder,
}: {
  selectedOrder: OrderRecord
  onClose: () => void
  onMarkReady: () => void
  onServeItem: (itemName: string) => void
  onHandoffOnlineOrder: () => void
}) {
  if (!selectedOrder) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md justify-end bg-[#0D0B09]/60"
      >
        <motion.aside
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 60, opacity: 0 }}
          className="h-full w-full max-w-md overflow-y-auto border-l border-stone-700 bg-[#181512] p-5"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] tracking-[0.22em] text-stone-400 uppercase">Order details</p>
              <h3 className="mt-1 text-xl font-semibold text-stone-100">{selectedOrder.id}</h3>
            </div>
            <button onClick={onClose} className="rounded-lg border border-stone-700 bg-[#11100E] px-2 py-1.5 text-sm text-stone-200">
              Close
            </button>
          </div>

          <div className="mb-5 flex items-center justify-between rounded-xl border border-stone-700 bg-[#11100E] p-3">
            <div>
              <p className="text-xs text-stone-400">Current status</p>
              <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${statusTone(selectedOrder.status)}`}>
                {selectedOrder.status}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-400">ETA</p>
              <p className="text-lg font-semibold text-[#F5F0EA]">{selectedOrder.eta}</p>
            </div>
          </div>

          <div className="mb-5 rounded-xl border border-[#B88E5D]/25 bg-[#B88E5D]/5 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-stone-100">
                  {selectedOrder.orderType === 'online' ? 'Online order · complete handoff' : 'In-person order · serve as items are ready'}
                </p>
                <p className="mt-1 text-xs leading-5 text-stone-400">
                  {selectedOrder.orderType === 'online'
                    ? 'Hold the order until every item is ready, then hand everything over together.'
                    : 'Serve each prepared item to the guest individually; do not hold the whole ticket.'}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-stone-700 bg-[#181512] px-2 py-1 text-[10px] text-stone-300">
                {selectedOrder.channel}
              </span>
            </div>
            {selectedOrder.status !== 'ready' &&
              selectedOrder.status !== 'completed' &&
              selectedOrder.status !== 'cancelled' && (
                <button
                  type="button"
                  onClick={onMarkReady}
                  className="mt-3 rounded-lg bg-[#B88E5D] px-3 py-2 text-xs font-semibold text-[#181512] transition hover:bg-[#C79B63]"
                >
                  Simulate kitchen: mark all ready
                </button>
              )}
            {selectedOrder.status === 'ready' && selectedOrder.orderType === 'online' && (
              <button
                type="button"
                onClick={onHandoffOnlineOrder}
                className="mt-3 w-full rounded-lg bg-[#B88E5D] px-3 py-2 text-xs font-semibold text-[#181512] transition hover:bg-[#C79B63]"
              >
                Hand off complete order ({selectedOrder.itemsList.length} items together)
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs tracking-[0.18em] text-stone-400 uppercase">Items</p>
              <div className="space-y-2">
                {selectedOrder.itemsList.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-3 rounded-xl border border-stone-700 bg-[#11100E] p-3 text-sm">
                    <div>
                      <p className="text-stone-200">{item.name} ×{item.qty}</p>
                      <p className="mt-1 text-xs text-stone-500">{item.prep} min prep</p>
                    </div>
                    {selectedOrder.servedItems.includes(item.name) ? (
                      <span className="rounded-full bg-[#A97D52]/10 px-2 py-1 text-[10px] text-[#D0B68A]">
                        {selectedOrder.orderType === 'online' ? 'Handed off' : 'Served'}
                      </span>
                    ) : selectedOrder.orderType === 'in-person' &&
                      selectedOrder.status === 'ready' ? (
                      <button
                        type="button"
                        onClick={() => onServeItem(item.name)}
                        className="shrink-0 rounded-lg border border-[#B88E5D]/30 bg-[#B88E5D]/10 px-2.5 py-1.5 text-xs text-[#DCC39F] transition hover:bg-[#B88E5D]/20"
                      >
                        Serve item
                      </button>
                    ) : selectedOrder.orderType === 'online' &&
                      selectedOrder.status === 'ready' ? (
                      <span className="rounded-full bg-[#A97D52]/10 px-2 py-1 text-[10px] text-[#D0B68A]">
                        Held for full order
                      </span>
                    ) : (
                      <span className="text-xs text-stone-500">In preparation</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs tracking-[0.18em] text-stone-400 uppercase">Dependencies</p>
              <div className="flex flex-wrap gap-2">
                {selectedOrder.dependencies.map((dep) => (
                  <span key={dep} className="rounded-full border border-stone-700 bg-[#11100E] px-2.5 py-1 text-xs text-stone-300">
                    {dep}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs tracking-[0.18em] text-stone-400 uppercase">Progress</p>
              <div className="h-2 rounded-full bg-stone-800">
                <div className="h-full rounded-full bg-gradient-to-r from-[#B88E5D] via-[#B88E5D] to-[#B5A38B]" style={{ width: `${selectedOrder.progress}%` }} />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs tracking-[0.18em] text-stone-400 uppercase">Recent events</p>
              <div className="space-y-2">
                {selectedOrder.events.map((event) => (
                  <div key={event} className="rounded-xl border border-stone-700 bg-[#11100E] p-2 text-sm text-stone-300">
                    {event}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.aside>
      </motion.div>
    </AnimatePresence>
  )
}

function MetricCard({ metric, index }: { metric: Metric; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-2xl border border-stone-700 bg-[#181512] p-4"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-stone-400">{metric.label}</p>
          <div className="mt-3 flex items-end gap-2">
            <h4 className="text-3xl font-semibold tracking-tight text-[#F5F0EA]">{metric.value}</h4>
            <span className={`mb-1 text-xs font-medium ${metric.delta.startsWith('-') ? 'text-[#F87171]' : 'text-[#B88E5D]'}`}>
              {metric.delta}
            </span>
          </div>
        </div>
        <div className={`rounded-full p-2 ${metric.sentiment === 'good' ? 'bg-[#A97D52]/10 text-[#B88E5D]' : metric.sentiment === 'warn' ? 'bg-[#A97D52]/10 text-[#D0B68A]' : 'bg-stone-500/10 text-stone-300'}`}>
          {metric.sentiment === 'good' ? <TrendingUp className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-stone-400">{metric.detail}</p>
        <div className="h-12 w-20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metric.trend.data.map((value, i) => ({ value, index: i }))}>
              <Area type="monotone" dataKey="value" stroke={metric.sentiment === 'warn' ? '#B88E5D' : '#B5A38B'} fill={metric.sentiment === 'warn' ? '#B88E5D20' : '#B5A38B20'} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  )
}

function DigitalTwinPage() {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-2xl border border-stone-700 bg-[#181512] p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] tracking-[0.26em] text-stone-400 uppercase">Live model</p>
              <h3 className="mt-1 text-lg font-semibold text-stone-100">BR Café Digital Twin</h3>
            </div>
            <button className="rounded-lg border border-stone-700 bg-[#11100E] px-3 py-2 text-xs text-stone-200">Follow live</button>
          </div>
          <div className="grid h-[420px] gap-4 md:grid-cols-[1.6fr_0.8fr]">
            <div className="relative overflow-hidden rounded-2xl border border-stone-700 bg-[radial-gradient(circle_at_top,_rgba(184,142,93,0.08),_rgba(9,14,20,0)_30%),linear-gradient(180deg,#11100E,#181512)] p-4">
              <div className="absolute left-6 top-8 h-28 w-28 rounded-xl border border-[#A97D52]/25 bg-[#A97D52]/10" />
              <div className="absolute left-1/3 top-10 h-28 w-48 rounded-xl border border-[#A97D52]/30 bg-[#A97D52]/10" />
              <div className="absolute right-8 top-14 h-24 w-24 rounded-xl border border-stone-500/25 bg-stone-500/10" />
              <div className="absolute bottom-7 left-8 right-8 h-24 rounded-2xl border border-stone-700 bg-[#181512]/80 p-4">
                <div className="grid h-full grid-cols-5 gap-2">
                  {[...Array(10)].map((_, index) => (
                    <div key={index} className={`rounded-lg $                    {index % 2 ? 'bg-[#A97D52]/15' : 'bg-stone-500/15'} border border-stone-600`} />
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-stone-700 bg-[#11100E] p-3">
                <p className="text-xs text-stone-400">Station utilization</p>
                <div className="mt-4 space-y-3">
                  {[
                    ['Barista 1', 78],
                    ['Espresso', 84],
                    ['Assembly', 73],
                    ['Pickup', 61],
                  ].map(([name, value]) => (
                    <div key={name}>
                      <div className="mb-1 flex justify-between text-xs text-stone-300">
                        <span>{name}</span>
                        <span>{value}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-stone-800">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#A97D52] to-[#D0B68A]" style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-stone-700 bg-[#11100E] p-3">
                <p className="text-xs text-stone-400">Waste recovery zones</p>
                <div className="mt-3 space-y-2 text-sm text-stone-200">
                  <div className="flex justify-between"><span>Compost</span><span>86%</span></div>
                  <div className="flex justify-between"><span>Recycling</span><span>72%</span></div>
                  <div className="flex justify-between"><span>Energy capture</span><span>68%</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-stone-700 bg-[#181512] p-4">
          <p className="text-[10px] tracking-[0.26em] text-stone-400 uppercase">Insights</p>
          <h3 className="mt-1 text-lg font-semibold text-stone-100">Operational health</h3>
          <div className="mt-5 space-y-4">
            {[
              ['Flow efficiency', '93%', '#B88E5D'],
              ['Energy burn', '64%', '#B5A38B'],
              ['Queue pressure', '81%', '#D0B68A'],
            ].map(([label, value, color]) => (
              <div key={label}>
                <div className="mb-1 flex justify-between text-sm text-stone-300">
                  <span>{label}</span>
                  <span>{value}</span>
                </div>
                <div className="h-2 rounded-full bg-stone-800">
                  <div className="h-full rounded-full" style={{ width: value, backgroundColor: color }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function AnalyticsPage() {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Throughput vs waste" subtitle="Load and recovery" className="p-4">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="ordersFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#B88E5D" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#B88E5D" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2A2724" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#A69E91" />
                <YAxis stroke="#A69E91" />
                <Tooltip />
                <Area type="monotone" dataKey="orders" stroke="#B88E5D" fill="url(#ordersFill)" strokeWidth={2} />
                <Area type="monotone" dataKey="waste" stroke="#B5A38B" fillOpacity={0} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Revenue and waste" subtitle="Weekly overview" className="p-4">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={supportChartData}>
                <CartesianGrid stroke="#2A2724" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#A69E91" />
                <YAxis stroke="#A69E91" />
                <Tooltip />
                <Bar dataKey="sales" fill="#B88E5D" radius={[6, 6, 0, 0]} />
                <Bar dataKey="waste" fill="#B5A38B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  )
}

function WasteLessPage() {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Material mix" subtitle="By recovery category" className="p-4">
          <div className="mt-4 space-y-3 text-sm">
            {[
              ['Food recovery', 44, '#B88E5D'],
              ['Compost', 27, '#B88E5D'],
              ['Plastic', 19, '#B5A38B'],
              ['E-waste', 10, '#B88E5D'],
            ].map(([label, value, color]) => (
              <div key={label}>
                <div className="mb-1 flex justify-between text-stone-300"><span>{label}</span><span>{value}%</span></div>
                <div className="h-2 rounded-full bg-stone-800">
              <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: String(color) }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Collection" subtitle="Bins scheduled" className="p-4">
          <div className="mt-4 space-y-3 text-sm text-stone-300">
            <div className="flex justify-between rounded-xl border border-stone-700 bg-[#11100E] p-3"><span>Organic</span><span>87%</span></div>
            <div className="flex justify-between rounded-xl border border-stone-700 bg-[#11100E] p-3"><span>Dry goods</span><span>68%</span></div>
            <div className="flex justify-between rounded-xl border border-stone-700 bg-[#11100E] p-3"><span>Metal</span><span>54%</span></div>
          </div>
        </Panel>

        <Panel title="Insights" subtitle="This cycle" className="p-4">
          <ul className="mt-4 space-y-2 text-sm text-stone-200">
            <li>• Overproduction on breakfast pastries is down 11%.</li>
            <li>• Compost cycle improved by 8.2% from baseline.</li>
            <li>• Waste collection due in 24 minutes.</li>
          </ul>
        </Panel>
      </div>
    </div>
  )
}

function OrderSyncPage({ orders }: { orders: OrderRecord[] }) {
  return (
    <div className="space-y-5">
      <Panel title="OrderSync" subtitle="Channel stream" className="p-4">
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {['Swiggy', 'Zomato', 'Website'].map((channel, index) => (
            <div key={channel} className="rounded-2xl border border-stone-700 bg-[#11100E] p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-300">{channel}</span>
                <span className="rounded-full bg-[#B88E5D]/10 px-2 py-1 text-[10px] text-[#B88E5D]">
                  {index === 0 ? 'Healthy' : index === 1 ? 'Stable' : 'Rising'}
                </span>
              </div>
              <p className="mt-5 text-3xl font-semibold text-[#F5F0EA]">{index === 0 ? '48' : index === 1 ? '31' : '62'}</p>
              <p className="mt-2 text-sm text-stone-400">Orders today</p>
            </div>
          ))}
        </div>
      </Panel>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-stone-500/25 bg-[#181512] p-5">
          <p className="text-[10px] tracking-[0.22em] text-stone-300 uppercase">Online channel policy</p>
          <h3 className="mt-2 text-lg font-semibold text-stone-100">One complete order, one handoff</h3>
          <p className="mt-2 text-sm leading-6 text-stone-400">
            Orders from Swiggy, Zomato, and the website stay at pickup until every line item is ready.
            Staff then hand over the whole order together.
          </p>
        </section>
        <section className="rounded-2xl border border-[#A97D52]/15 bg-[#181512] p-5">
          <p className="text-[10px] tracking-[0.22em] text-[#B88E5D] uppercase">In-person service policy</p>
          <h3 className="mt-2 text-lg font-semibold text-stone-100">Serve each item as it is ready</h3>
          <p className="mt-2 text-sm leading-6 text-stone-400">
            Dine-in and counter orders can be served progressively. Each ready item is marked served
            separately from the order details drawer.
          </p>
        </section>
      </div>
      <section className="rounded-2xl border border-stone-700 bg-[#181512]">
        <div className="border-b border-stone-700 p-4">
          <h2 className="font-semibold">Incoming order tickets</h2>
          <p className="mt-1 text-xs text-stone-400">Backend order records refresh every 20 seconds when available. Static examples are marked demo.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-stone-400">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-3 py-3 font-medium">Source</th>
                <th className="px-3 py-3 font-medium">Items</th>
                <th className="px-3 py-3 font-medium">Station</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Origin</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-stone-800">
                  <td className="px-4 py-3 font-medium text-stone-100">{order.id}</td>
                  <td className="px-3 py-3 text-stone-300">{order.channel}</td>
                  <td className="px-3 py-3 text-stone-300">{order.items}</td>
                  <td className="px-3 py-3 text-stone-400">{order.station}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-1 text-[10px] ${statusTone(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-[10px] ${order.dataSource === 'api' ? 'bg-[#A97D52]/10 text-[#D0B68A]' : 'bg-stone-500/10 text-stone-300'}`}>
                      {order.dataSource === 'api' ? 'Backend' : 'Demo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function ServiceLedgerPage() {
  return (
    <Panel title="ServiceLedger" subtitle="Adjustments & payouts" className="p-4">
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-stone-700 bg-[#11100E] p-4">
          <p className="text-sm text-stone-400">Net revenue</p>
          <p className="mt-4 text-3xl font-semibold text-[#F5F0EA]">₹18,420</p>
        </div>
        <div className="rounded-2xl border border-stone-700 bg-[#11100E] p-4">
          <p className="text-sm text-stone-400">Outstanding payouts</p>
          <p className="mt-4 text-3xl font-semibold text-[#F5F0EA]">₹2,460</p>
        </div>
      </div>
    </Panel>
  )
}

function RushSchedulerPage() {
  return (
    <Panel title="Rush-Hour Scheduler" subtitle="Plan optimization" className="p-4">
      <div className="mt-4 rounded-2xl border border-stone-700 bg-[#11100E] p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-stone-300">Current strategy</p>
          <span className="rounded-full bg-[#B88E5D]/10 px-2 py-1 text-[10px] text-[#B88E5D]">Rush mode</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['Late orders', '6 / 34', '#F87171'],
            ['Stations active', '5 / 6', '#B88E5D'],
            ['SLA health', '91%', '#B88E5D'],
          ].map(([label, value, color]) => (
            <div key={label} className="rounded-xl border border-stone-700 bg-[#181512] p-3">
              <p className="text-xs text-stone-400">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-[#F5F0EA]" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  )
}

function ActivityPage() {
  return (
    <Panel title="Activity & Events" subtitle="Across all systems" className="p-4">
      <div className="mt-4 space-y-3">
        {activityFeed.map((item) => (
          <div key={item.link} className="flex items-start gap-3 rounded-2xl border border-stone-700 bg-[#11100E] p-3">
            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#B88E5D]/10 text-[#B88E5D]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-stone-100">{item.type}</p>
                <span className="text-[10px] text-stone-400">{item.time}</span>
              </div>
              <p className="mt-1 text-sm text-stone-400">{item.detail}</p>
              <button className="mt-2 text-xs text-[#B88E5D]">{item.link}</button>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function SettingsPage() {
  return (
    <Panel title="Settings" subtitle="Branch controls" className="p-4">
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-stone-700 bg-[#11100E] p-4">
          <p className="text-sm text-stone-300">Branch profile</p>
          <p className="mt-2 text-[#B88E5D]">BR Café — Downtown</p>
        </div>
        <div className="rounded-2xl border border-stone-700 bg-[#11100E] p-4">
          <p className="text-sm text-stone-300">Queue policy</p>
          <p className="mt-2 text-[#B88E5D]">FIFO + rush optimization</p>
        </div>
      </div>
    </Panel>
  )
}

function Panel({
  title,
  subtitle,
  children,
  className,
}: {
  title: string
  subtitle: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-2xl border border-stone-700 bg-[#181512] ${className ?? ''}`}>
      <div className="mb-3 border-b border-stone-700 px-4 pb-3 pt-4">
        <p className="text-[10px] tracking-[0.26em] text-stone-400 uppercase">{subtitle}</p>
        <h3 className="mt-1 text-lg font-semibold text-stone-100">{title}</h3>
      </div>
      {children}
    </section>
  )
}

function statusTone(status: StatusTone) {
  switch (status) {
    case 'queued':
      return 'bg-stone-500/15 text-stone-200'
    case 'preparing':
      return 'bg-[#A97D52]/10 text-[#D0B68A]'
    case 'ready':
      return 'bg-stone-500/15 text-stone-200'
    case 'delayed':
      return 'bg-[#A97D52]/15 text-[#D0B68A]'
    case 'completed':
      return 'bg-stone-500/10 text-stone-200'
    case 'cancelled':
      return 'bg-rose-500/15 text-rose-200'
    default:
      return 'bg-stone-500/15 text-stone-200'
  }
}

function priorityTone(priority: 'High' | 'Normal' | 'Low') {
  switch (priority) {
    case 'High':
      return 'bg-rose-500/15 text-rose-200'
    case 'Normal':
      return 'bg-[#A97D52]/10 text-[#D0B68A]'
    case 'Low':
      return 'bg-stone-500/15 text-stone-200'
    default:
      return 'bg-stone-500/15 text-stone-200'
  }
}

function severityTone(severity: string) {
  switch (severity) {
    case 'High':
      return 'bg-rose-500/15 text-rose-200'
    case 'Medium':
      return 'bg-[#A97D52]/15 text-[#D0B68A]'
    case 'Low':
      return 'bg-stone-500/15 text-stone-200'
    default:
      return 'bg-stone-500/15 text-stone-200'
  }
}

export default App
