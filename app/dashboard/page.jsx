"use client"

import { useState, useEffect } from "react"
import Layout from "../components/Layout"
import { TrendingUp, Package, AlertTriangle, ShoppingCart } from "lucide-react"


export default function Dashboard() {
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [purchases, setPurchases] = useState([])

  useEffect(() => {
    // Load data from localStorage
    const savedProducts = localStorage.getItem("products")
    const savedSales = localStorage.getItem("sales")
    const savedPurchases = localStorage.getItem("purchases")

    if (savedProducts) setProducts(JSON.parse(savedProducts))
    if (savedSales) setSales(JSON.parse(savedSales))
    if (savedPurchases) setPurchases(JSON.parse(savedPurchases))
  }, [])

  // Calculate metrics
  const totalProducts = products.length
  const totalStock = products.reduce((sum, product) => sum + product.quantity, 0)
  const lowStockItems = products.filter((product) => product.quantity <= product.minStock)

  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0)
  const totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.total, 0)

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const monthlySales = sales
    .filter((sale) => {
      const saleDate = new Date(sale.date)
      return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear
    })
    .reduce((sum, sale) => sum + sale.total, 0)

  const monthlyPurchases = purchases
    .filter((purchase) => {
      const purchaseDate = new Date(purchase.date)
      return purchaseDate.getMonth() === currentMonth && purchaseDate.getFullYear() === currentYear
    })
    .reduce((sum, purchase) => sum + purchase.total, 0)

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
      value: `$${monthlySales.toFixed(2)}`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      name: "Monthly Purchases",
      value: `$${monthlyPurchases.toFixed(2)}`,
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
          <p className="mt-2 text-gray-600">Overview of your inventory and business metrics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.name} className="card">
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
          <div className="card border-l-4 border-red-500 bg-red-50">
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
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="text-red-800 font-medium">{item.name}</span>
                    <span className="text-red-600">
                      {item.quantity} / {item.minStock} min
                    </span>
                  </div>
                ))}
                {lowStockItems.length > 5 && (
                  <p className="text-red-600 text-sm">+{lowStockItems.length - 5} more items</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sales */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Sales</h3>
            {sales.length > 0 ? (
              <div className="space-y-3">
                {sales
                  .slice(-5)
                  .reverse()
                  .map((sale) => (
                    <div
                      key={sale.id}
                      className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{sale.customer}</p>
                        <p className="text-sm text-gray-500">{new Date(sale.date).toLocaleDateString()}</p>
                      </div>
                      <p className="font-medium text-green-600">${sale.total.toFixed(2)}</p>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No sales recorded yet</p>
            )}
          </div>

          {/* Recent Purchases */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Purchases</h3>
            {purchases.length > 0 ? (
              <div className="space-y-3">
                {purchases
                  .slice(-5)
                  .reverse()
                  .map((purchase) => (
                    <div
                      key={purchase.id}
                      className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{purchase.supplier}</p>
                        <p className="text-sm text-gray-500">{new Date(purchase.date).toLocaleDateString()}</p>
                      </div>
                      <p className="font-medium text-blue-600">${purchase.total.toFixed(2)}</p>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No purchases recorded yet</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
