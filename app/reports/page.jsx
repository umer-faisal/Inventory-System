"use client"

import { useState, useEffect } from "react"
import Layout from "../components/Layout"
import { Download, Filter, BarChart3, TrendingUp, Package } from "lucide-react"

export default function Reports() {
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [purchases, setPurchases] = useState([])
  const [activeTab, setActiveTab] = useState("inventory")

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    category: "",
    customer: "",
    supplier: "",
  })

  useEffect(() => {
    const savedProducts = localStorage.getItem("products")
    const savedSales = localStorage.getItem("sales")
    const savedPurchases = localStorage.getItem("purchases")

    if (savedProducts) setProducts(JSON.parse(savedProducts))
    if (savedSales) setSales(JSON.parse(savedSales))
    if (savedPurchases) setPurchases(JSON.parse(savedPurchases))
  }, [])

  const categories = ["Servo Motors", "PLCs", "Sensors", "Actuators", "Controllers", "Other"]
  const customers = [
    "Acme Manufacturing",
    "Tech Solutions Inc.",
    "Industrial Corp.",
    "AutoTech Ltd.",
    "Control Systems Co.",
  ]
  const suppliers = [
    "ABC Electronics",
    "TechSupply Co.",
    "Industrial Parts Ltd.",
    "AutoMation Inc.",
    "Control Systems Pro",
  ]

  const getProductName = (productId) => {
    const product = products.find((p) => p.id === productId)
    return product ? `${product.name} (${product.brand} - ${product.model})` : "Unknown Product"
  }

  const filteredSales = sales.filter((sale) => {
    const saleDate = new Date(sale.date)
    const startDate = filters.startDate ? new Date(filters.startDate) : null
    const endDate = filters.endDate ? new Date(filters.endDate) : null

    const dateMatch = (!startDate || saleDate >= startDate) && (!endDate || saleDate <= endDate)
    const customerMatch = !filters.customer || sale.customer === filters.customer

    return dateMatch && customerMatch
  })

  const filteredPurchases = purchases.filter((purchase) => {
    const purchaseDate = new Date(purchase.date)
    const startDate = filters.startDate ? new Date(filters.startDate) : null
    const endDate = filters.endDate ? new Date(filters.endDate) : null

    const dateMatch = (!startDate || purchaseDate >= startDate) && (!endDate || purchaseDate <= endDate)
    const supplierMatch = !filters.supplier || purchase.supplier === filters.supplier

    return dateMatch && supplierMatch
  })

  const filteredProducts = products.filter((product) => {
    return !filters.category || product.category === filters.category
  })

  const exportToCSV = (data, filename) => {
    if (data.length === 0) {
      alert("No data to export")
      return
    }

    const headers = Object.keys(data[0]).join(",")
    const csvContent = [headers, ...data.map((row) => Object.values(row).join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportInventoryReport = () => {
    const reportData = filteredProducts.map((product) => ({
      Name: product.name,
      Brand: product.brand,
      Model: product.model,
      Category: product.category,
      "Current Stock": product.quantity,
      "Min Stock": product.minStock,
      "Unit Cost": product.unitCost,
      "Selling Price": product.sellingPrice,
      "Stock Value": (product.quantity * product.unitCost).toFixed(2),
    }))
    exportToCSV(reportData, "inventory-report")
  }

  const exportSalesReport = () => {
    const reportData = filteredSales.map((sale) => ({
      Date: sale.date,
      Customer: sale.customer,
      "Items Count": sale.items.length,
      Total: sale.total.toFixed(2),
    }))
    exportToCSV(reportData, "sales-report")
  }

  const exportPurchasesReport = () => {
    const reportData = filteredPurchases.map((purchase) => ({
      Date: purchase.date,
      Supplier: purchase.supplier,
      "Items Count": purchase.items.length,
      Total: purchase.total.toFixed(2),
    }))
    exportToCSV(reportData, "purchases-report")
  }

  const totalInventoryValue = filteredProducts.reduce((sum, product) => sum + product.quantity * product.unitCost, 0)

  const totalSalesValue = filteredSales.reduce((sum, sale) => sum + sale.total, 0)
  const totalPurchasesValue = filteredPurchases.reduce((sum, purchase) => sum + purchase.total, 0)

  const lowStockItems = filteredProducts.filter((product) => product.quantity <= product.minStock)

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-2 text-gray-600">Generate comprehensive reports and insights</p>
        </div>

        {/* Filters */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364] focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364] focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364] focus:border-transparent text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
              <select
                value={filters.customer}
                onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364] focus:border-transparent text-sm"
              >
                <option value="">All Customers</option>
                {customers.map((customer) => (
                  <option key={customer} value={customer}>
                    {customer}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <select
                value={filters.supplier}
                onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364] focus:border-transparent text-sm"
              >
                <option value="">All Suppliers</option>
                {suppliers.map((supplier) => (
                  <option key={supplier} value={supplier}>
                    {supplier}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                <p className="text-2xl font-bold text-gray-900">${totalInventoryValue.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">${totalSalesValue.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                <p className="text-2xl font-bold text-gray-900">${totalPurchasesValue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: "inventory", name: "Inventory Report", icon: Package },
                { id: "sales", name: "Sales Report", icon: TrendingUp },
                { id: "purchases", name: "Purchases Report", icon: BarChart3 },
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-[#2C5364] text-[#2C5364]"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="pt-6">
            {activeTab === "inventory" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Inventory Summary</h3>
                  <button onClick={exportInventoryReport} className="btn-primary flex items-center gap-2 text-sm">
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>

                {lowStockItems.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <h4 className="text-red-800 font-medium mb-2">Low Stock Alert ({lowStockItems.length} items)</h4>
                    <div className="space-y-1">
                      {lowStockItems.map((item) => (
                        <div key={item.id} className="text-sm text-red-700">
                          {item.name} - Current: {item.quantity}, Min: {item.minStock}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Cost
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">
                              {product.brand} - {product.model}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                product.quantity <= product.minStock
                                  ? "bg-red-100 text-red-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {product.quantity} units
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${product.unitCost.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ${(product.quantity * product.unitCost).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "sales" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Sales Report</h3>
                  <button onClick={exportSalesReport} className="btn-primary flex items-center gap-2 text-sm">
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Items
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredSales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(sale.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.customer}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="space-y-1">
                              {sale.items.map((item, index) => (
                                <div key={index} className="text-xs">
                                  {getProductName(item.productId)} - Qty: {item.quantity}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            ${sale.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "purchases" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Purchases Report</h3>
                  <button onClick={exportPurchasesReport} className="btn-primary flex items-center gap-2 text-sm">
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Supplier
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Items
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPurchases.map((purchase) => (
                        <tr key={purchase.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(purchase.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.supplier}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="space-y-1">
                              {purchase.items.map((item, index) => (
                                <div key={index} className="text-xs">
                                  {getProductName(item.productId)} - Qty: {item.quantity}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                            ${purchase.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
