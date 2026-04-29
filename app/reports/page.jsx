"use client"

import { useState, useEffect } from "react"
import Layout from "../components/Layout"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { supabase } from "../../lib/supabase"
import { useRouter } from "next/navigation"
import { TrendingUp, Package, AlertTriangle, DollarSign } from "lucide-react"

export default function Reports() {
  const [tab, setTab] = useState("overview")
  const [salesChart, setSalesChart] = useState([])
  const [stockChart, setStockChart] = useState([])
  const [customerReport, setCustomerReport] = useState([])
  const [productReport, setProductReport] = useState([])
  const [summary, setSummary] = useState({ totalRevenue: 0, totalProfit: 0, lowStock: 0, totalInvoices: 0 })
  const router = useRouter()

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (!userStr || JSON.parse(userStr).role !== 'admin') { router.push("/dashboard"); return }
    fetchData()
  }, [router])

  const fetchData = async () => {
    // Sales with items
    const { data: sales } = await supabase.from("sales").select("*, customers(name), sale_items(*, products(name, cost_price))")
    // Inventory
    const { data: inventory } = await supabase.from("inventory").select("*, products(name)")

    if (sales) {
      let totalRev = 0, totalCost = 0, invoiceCount = 0
      const monthly = {}, customerMap = {}, productMap = {}

      sales.forEach(sale => {
        if (sale.status !== 'Invoice') return
        totalRev += Number(sale.total_amount)
        invoiceCount++

        const month = new Date(sale.created_at).toLocaleString('default', { month: 'short', year: '2-digit' })
        monthly[month] = (monthly[month] || 0) + Number(sale.total_amount)

        // Customer report
        const cname = sale.customers?.name || "Unknown"
        if (!customerMap[cname]) customerMap[cname] = { name: cname, total: 0, count: 0 }
        customerMap[cname].total += Number(sale.total_amount)
        customerMap[cname].count++

        // Product & profit
        sale.sale_items?.forEach(item => {
          const cost = Number(item.products?.cost_price || 0) * item.quantity
          totalCost += cost
          const pname = item.products?.name || "Unknown"
          if (!productMap[pname]) productMap[pname] = { name: pname, revenue: 0, cost: 0, qty: 0 }
          productMap[pname].revenue += Number(item.total_price)
          productMap[pname].cost += cost
          productMap[pname].qty += item.quantity
        })
      })

      setSalesChart(Object.entries(monthly).map(([name, Revenue]) => ({ name, Revenue })))
      setCustomerReport(Object.values(customerMap).sort((a, b) => b.total - a.total))
      setProductReport(Object.values(productMap).sort((a, b) => b.revenue - a.revenue).map(p => ({ ...p, profit: p.revenue - p.cost, margin: p.revenue > 0 ? (((p.revenue - p.cost) / p.revenue) * 100).toFixed(1) : 0 })))
      setSummary(prev => ({ ...prev, totalRevenue: totalRev, totalProfit: totalRev - totalCost, totalInvoices: invoiceCount }))
    }

    if (inventory) {
      let lowCount = 0
      const wh = { Nazimabad: 0, SITE: 0 }
      inventory.forEach(i => {
        wh[i.warehouse] = (wh[i.warehouse] || 0) + i.quantity
        if (i.quantity <= i.min_stock) lowCount++
      })
      setStockChart([{ name: 'Nazimabad', Stock: wh.Nazimabad }, { name: 'SITE', Stock: wh.SITE }])
      setSummary(prev => ({ ...prev, lowStock: lowCount }))
    }
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "customers", label: "Customer-wise" },
    { id: "products", label: "Product-wise" },
    { id: "stock", label: "Stock" },
  ]

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-2 text-gray-600">Complete business performance reports as per SRS Clause 11</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Revenue", value: `Rs ${summary.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "bg-green-50 border-green-200 text-green-800" },
            { label: "Est. Profit", value: `Rs ${summary.totalProfit.toLocaleString()}`, icon: TrendingUp, color: "bg-blue-50 border-blue-200 text-blue-800" },
            { label: "Total Invoices", value: summary.totalInvoices, icon: Package, color: "bg-purple-50 border-purple-200 text-purple-800" },
            { label: "Low Stock Items", value: summary.lowStock, icon: AlertTriangle, color: "bg-red-50 border-red-200 text-red-800" },
          ].map(card => (
            <div key={card.label} className={`border rounded-xl p-4 ${card.color}`}>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{card.label}</p>
              <p className="text-2xl font-bold mt-1">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="border-b flex gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${tab === t.id ? 'bg-white border border-b-white text-[#2C5364] font-bold -mb-px' : 'text-gray-500 hover:text-gray-700'}`}>{t.label}</button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h3 className="font-bold text-gray-900 mb-4">Monthly Revenue (Invoices Only)</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesChart}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis tickFormatter={v => `Rs ${(v/1000).toFixed(0)}k`} /><Tooltip formatter={v => [`Rs ${Number(v).toLocaleString()}`, "Revenue"]} /><Bar dataKey="Revenue" fill="#2C5364" radius={[4,4,0,0]} /></BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h3 className="font-bold text-gray-900 mb-4">Warehouse Stock Comparison</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stockChart}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="Stock" fill="#0F2027" radius={[4,4,0,0]} /></BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Customer-wise Tab */}
        {tab === "customers" && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Sales</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. of Invoices</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customerReport.map((c, i) => (
                  <tr key={c.name} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-400 font-medium">{i + 1}</td>
                    <td className="px-6 py-3 font-semibold text-gray-900">{c.name}</td>
                    <td className="px-6 py-3 font-bold text-green-700">Rs {c.total.toLocaleString()}</td>
                    <td className="px-6 py-3 text-gray-600">{c.count}</td>
                    <td className="px-6 py-3 text-gray-600">Rs {(c.total / c.count).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  </tr>
                ))}
                {customerReport.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">No invoice data yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* Product-wise Tab */}
        {tab === "products" && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty Sold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {productReport.map(p => (
                  <tr key={p.name} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-semibold text-gray-900">{p.name}</td>
                    <td className="px-6 py-3 text-gray-600">{p.qty}</td>
                    <td className="px-6 py-3 font-bold text-blue-700">Rs {p.revenue.toLocaleString()}</td>
                    <td className="px-6 py-3 font-bold text-green-700">Rs {p.profit.toLocaleString()}</td>
                    <td className="px-6 py-3"><span className={`px-2 py-0.5 rounded text-xs font-bold ${p.margin >= 20 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{p.margin}%</span></td>
                  </tr>
                ))}
                {productReport.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">No product sales data yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* Stock Tab */}
        {tab === "stock" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h3 className="font-bold text-gray-900 mb-4">Warehouse Stock</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stockChart}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="Stock" fill="#2C5364" radius={[4,4,0,0]} /></BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h3 className="font-bold text-gray-900 mb-2">Summary</h3>
              <div className="space-y-3">
                {stockChart.map(w => (
                  <div key={w.name} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">{w.name} Warehouse</span>
                    <span className="font-bold text-gray-900 text-lg">{w.Stock} units</span>
                  </div>
                ))}
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="font-semibold text-blue-800">Combined Total</span>
                  <span className="font-bold text-blue-900 text-lg">{stockChart.reduce((s, w) => s + w.Stock, 0)} units</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
