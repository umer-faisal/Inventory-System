"use client"

import { useState, useEffect } from "react"
import Layout from "../components/Layout"
import { Plus, Calendar, User, Package } from "lucide-react"

export default function Purchases() {
  const [products, setProducts] = useState([])
  const [purchases, setPurchases] = useState([])
  const [showModal, setShowModal] = useState(false)

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    supplier: "",
    items: [],
  })

  const suppliers = [
    "ABC Electronics",
    "TechSupply Co.",
    "Industrial Parts Ltd.",
    "AutoMation Inc.",
    "Control Systems Pro",
  ]

  useEffect(() => {
    const savedProducts = localStorage.getItem("products")
    const savedPurchases = localStorage.getItem("purchases")

    if (savedProducts) setProducts(JSON.parse(savedProducts))
    if (savedPurchases) setPurchases(JSON.parse(savedPurchases))
  }, [])

  useEffect(() => {
    localStorage.setItem("purchases", JSON.stringify(purchases))
  }, [purchases])

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: "", quantity: 1, cost: 0 }],
    })
  }

  const updateItem = (index, field, value) => {
    const updatedItems = formData.items.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    setFormData({ ...formData, items: updatedItems })
  }

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    })
  }

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.quantity * item.cost, 0)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (formData.items.length === 0) {
      alert("Please add at least one item")
      return
    }

    const newPurchase = {
      id: Date.now().toString(),
      date: formData.date,
      supplier: formData.supplier,
      items: formData.items,
      total: calculateTotal(),
    }

    // Update product quantities
    const updatedProducts = products.map((product) => {
      const purchaseItem = formData.items.find((item) => item.productId === product.id)
      if (purchaseItem) {
        return {
          ...product,
          quantity: product.quantity + purchaseItem.quantity,
          unitCost: purchaseItem.cost, // Update unit cost with latest purchase price
        }
      }
      return product
    })

    setProducts(updatedProducts)
    localStorage.setItem("products", JSON.stringify(updatedProducts))

    setPurchases([...purchases, newPurchase])
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      supplier: "",
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
            <h1 className="text-3xl font-bold text-gray-900">Purchase Management</h1>
            <p className="mt-2 text-gray-600">Record and manage purchase invoices</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Purchase
          </button>
        </div>

        {/* Purchases List */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Purchase History</h3>
          {purchases.length > 0 ? (
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
                  {purchases.map((purchase) => (
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Rs{purchase.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No purchases recorded yet</p>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Add Purchase Invoice</h2>

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
                        Supplier
                      </label>
                      <select
                        value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364] focus:border-transparent"
                        required
                      >
                        <option value="">Select Supplier</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier} value={supplier}>
                            {supplier}
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
                        className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 p-3 border border-gray-200 rounded-lg"
                      >
                        <div>
                          <select
                            value={item.productId}
                            onChange={(e) => updateItem(index, "productId", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364] focus:border-transparent text-sm"
                            required
                          >
                            <option value="">Select Product</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name} ({product.brand} - {product.model})
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
                            required
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Unit Cost"
                            value={item.cost}
                            onChange={(e) => updateItem(index, "cost", Number.parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364] focus:border-transparent text-sm"
                            min="0"
                            required
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Rs {(item.quantity * item.cost).toFixed(2)}</span>
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
                      <span>Rs {calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={resetForm} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Add Purchase
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
