"use client"

import { useState, useEffect } from "react"
import Layout from "../components/Layout"
import { TrendingUp, Package, AlertTriangle, ShoppingCart } from "lucide-react"
import { supabase } from "../../lib/supabase"

export default function Dashboard() {
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])
  const [totalStock, setTotalStock] = useState(0)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch Products
        const { data: productsData } = await supabase.from("products").select("*")
        
        // Fetch Inventory (to calculate stock and low stock)
        const { data: inventoryData } = await supabase.from("inventory").select(`
          *,
          products ( name, sku )
        `)
        
        // Fetch Sales
        const { data: salesData } = await supabase.from("sales").select("*").order('created_at', { ascending: false }).limit(10)

        if (productsData) setProducts(productsData)
        if (salesData) setSales(salesData)
        
        if (inventoryData) {
          let total = 0
          let lowStock = []
          inventoryData.forEach(item => {
            total += item.quantity || 0
            if (item.quantity <= (item.min_stock || 5)) {
              lowStock.push({
                id: item.id,
                name: item.products?.name || "Unknown",
                warehouse: item.warehouse,
                quantity: item.quantity,
                minStock: item.min_stock || 5
              })
            }
          })
          setTotalStock(total)
          setLowStockItems(lowStock)
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      }
    }

    fetchData()
  }, [])

  // Calculate metrics
  const totalProducts = products.length

  const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0)

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const monthlySales = sales
    .filter((sale) => {
      const saleDate = new Date(sale.created_at)
      return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear
    })
    .reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0)

  const stats = [
    {
      name: "Total Products",
      value: totalProducts,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      name: "Total Stock",
      value: totalStock,
      icon: Package,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      name: "Monthly Sales",
      value: `Rs ${monthlySales.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      name: "Total Sales",
      value: `Rs ${totalSales.toLocaleString()}`,
      icon: ShoppingCart,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ]

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Overview of your inventory and business metrics (Live from Supabase)</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.name} className="card bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <div className="card border-l-4 border-red-500 bg-red-50 p-6 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">Low Stock Alert</h3>
                <p className="text-red-700">{lowStockItems.length} item(s) are running low on stock</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="space-y-2">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm border-b border-red-100 pb-2">
                    <span className="text-red-800 font-medium">{item.name} ({item.warehouse})</span>
                    <span className="text-red-600 font-bold">
                      {item.quantity} / {item.minStock} min
                    </span>
                  </div>
                ))}
                {lowStockItems.length > 5 && (
                  <p className="text-red-600 text-sm mt-2">+{lowStockItems.length - 5} more items</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sales */}
          <div className="card bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Sales</h3>
            {sales.length > 0 ? (
              <div className="space-y-3">
                {sales
                  .slice(0, 5)
                  .map((sale) => (
                    <div
                      key={sale.id}
                      className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                           {sale.has_tax ? 'Tax Invoice' : 'Non-Tax Invoice'} ({sale.warehouse})
                        </p>
                        <p className="text-sm text-gray-500">{new Date(sale.created_at).toLocaleDateString()}</p>
                      </div>
                      <p className="font-medium text-green-600">Rs {Number(sale.total_amount).toLocaleString()}</p>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No sales recorded yet</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
