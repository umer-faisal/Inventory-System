"use client"

import { useState, useEffect } from "react"
import Layout from "../components/Layout"
import { Plus, Calendar, User, Package } from "lucide-react"

export default function Sales() {
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [showModal, setShowModal] = useState(false)

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    customer: "",
    items: [],
  })

  const customers = [
    "Acme Manufacturing",
    "Tech Solutions Inc.",
    "Industrial Corp.",
    "AutoTech Ltd.",
    "Control Systems Co.",
  ]

  useEffect(() => {
    const savedProducts = localStorage.getItem("products")
    const savedSales = localStorage.getItem("sales")

    if (savedProducts) setProducts(JSON.parse(savedProducts))
    if (savedSales) setSales(JSON.parse(savedSales))
  }, [])

  useEffect(() => {
    localStorage.setItem("sales", JSON.stringify(sales))
  }, [sales])

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: "", quantity: 1, price: 0 }],
    })
  }

  const updateItem = (index, field, value) => {
    const updatedItems = formData.items.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value }

        // Auto-fill price when product is selected
        if (field === "productId" && typeof value === "string") {
          const product = products.find((p) => p.id === value)
          if (product) {
            updatedItem.price = product.sellingPrice
          }
        }

        return updatedItem
      }
      return item
    })
    setFormData({ ...formData, items: updatedItems })
  }

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    })
  }

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.quantity * item.price, 0)
  }

  const getAvailableStock = (productId) => {
    const product = products.find((p) => p.id === productId)
    return product ? product.quantity : 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (formData.items.length === 0) {
      alert("Please add at least one item")
      return
    }

    // Check stock availability
    for (const item of formData.items) {
      const availableStock = getAvailableStock(item.productId)
      if (item.quantity > availableStock) {
        const product = products.find((p) => p.id === item.productId)
        alert(`Insufficient stock for ${product?.name}. Available: ${availableStock}, Required: ${item.quantity}`)
        return
      }
    }

    const newSale = {
      id: Date.now().toString(),
      date: formData.date,
      customer: formData.customer,
      items: formData.items,
      total: calculateTotal(),
    }

    // Update product quantities (deduct sold items)
    const updatedProducts = products.map((product) => {
      const saleItem = formData.items.find((item) => item.productId === product.id)
      if (saleItem) {
        return {
          ...product,
          quantity: product.quantity - saleItem.quantity,
        }
      }
      return product
    })

    setProducts(updatedProducts)
    localStorage.setItem("products", JSON.stringify(updatedProducts))

    setSales([...sales, newSale])
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      customer: "",
      items: [],
    })
    setShowModal(false)
  }

  const getProductName = (productId) => {
    const product = products.find((p) => p.id === productId)
    return product ? `${product.name} (${product.brand} - ${product.model})` : "Unknown Product"
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Management</h1>
            <p className="mt-2 text-gray-600">Record and manage sales invoices</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Sale
          </button>
        </div>

        {/* Sales List */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sales History</h3>
          {sales.length > 0 ? (
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
                  {sales.map((sale) => (
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
          ) : (
            <p className="text-gray-500 text-center py-8">No sales recorded yet</p>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Add Sales Invoice</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Date
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364] focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <User className="w-4 h-4 inline mr-1" />
                        Customer
                      </label>
                      <select
                        value={formData.customer}
                        onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364] focus:border-transparent"
                        required
                      >
                        <option value="">Select Customer</option>
                        {customers.map((customer) => (
                          <option key={customer} value={customer}>
                            {customer}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        <Package className="w-4 h-4 inline mr-1" />
                        Items
                      </label>
                      <button type="button" onClick={addItem} className="btn-secondary text-sm">
                        Add Item
                      </button>
                    </div>

                    {formData.items.map((item, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3 p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="md:col-span-2">
                          <select
                            value={item.productId}
                            onChange={(e) => updateItem(index, "productId", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364] focus:border-transparent text-sm"
                            required
                          >
                            <option value="">Select Product</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name} ({product.brand} - {product.model}) - Stock: {product.quantity}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="Quantity"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", Number.parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364] focus:border-transparent text-sm"
                            min="1"
                            max={getAvailableStock(item.productId)}
                            required
                          />
                          {item.productId && (
                            <p className="text-xs text-gray-500 mt-1">Available: {getAvailableStock(item.productId)}</p>
                          )}
                        </div>
                        <div>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Unit Price"
                            value={item.price}
                            onChange={(e) => updateItem(index, "price", Number.parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364] focus:border-transparent text-sm"
                            min="0"
                            required
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">${(item.quantity * item.price).toFixed(2)}</span>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={resetForm} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Add Sale
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
