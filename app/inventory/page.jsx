"use client"

import { useState, useEffect } from "react"
import Layout from "../components/Layout"
import { Plus, Edit, Trash2, Search, Building2 } from "lucide-react"
import { supabase } from "../../lib/supabase"

export default function Inventory() {
  const [products, setProducts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [warehouseFilter, setWarehouseFilter] = useState("Nazimabad")

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    brand: "",
    model_number: "",
    category: "Servo Motors",
    condition: "New",
    wattage: "",
    voltage: "",
    phase: "Single",
    quantity: 0,
    min_stock: 5,
    cost_price: 0,
    selling_price: 0,
    warehouse: "Nazimabad",
    rack_number: "",
    specs: "",
  })

  const categories = ["Servo Motors", "PLCs", "Sensors", "Actuators", "Controllers", "Other"]
  const warehouses = ["Nazimabad", "SITE"]

  useEffect(() => {
    fetchInventory()
  }, [warehouseFilter])

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from("inventory")
        .select(`
          *,
          products (*)
        `)
        .eq("warehouse", warehouseFilter)

      if (error) throw error

      if (data) {
        // Flatten the data for easier use in the table
        const formattedData = data.map(item => ({
          ...item.products, // spread product details
          inventory_id: item.id,
          quantity: item.quantity,
          min_stock: item.min_stock,
          warehouse: item.warehouse,
          rack_number: item.rack_number
        }))
        setProducts(formattedData)
      }
    } catch (error) {
      console.error("Error fetching inventory:", error)
      alert("Failed to load inventory. Please ensure database is connected.")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingProduct) {
        // Update product
        const { error: productError } = await supabase
          .from("products")
          .update({
            name: formData.name,
            sku: formData.sku,
            brand: formData.brand,
            model_number: formData.model_number,
            category: formData.category,
            condition: formData.condition,
            wattage: formData.wattage,
            voltage: formData.voltage,
            phase: formData.phase,
            cost_price: formData.cost_price,
            selling_price: formData.selling_price,
            notes: formData.specs
          })
          .eq("id", editingProduct.id)
        if (productError) throw productError

        // Update inventory
        const { error: invError } = await supabase
          .from("inventory")
          .update({
            quantity: formData.quantity,
            min_stock: formData.min_stock,
            rack_number: formData.rack_number
          })
          .eq("id", editingProduct.inventory_id)
        if (invError) throw invError

        alert("Product updated successfully!")
      } else {
        // Create new product
        const { data: newProduct, error: productError } = await supabase
          .from("products")
          .insert({
            name: formData.name,
            sku: formData.sku || `SKU-${Date.now()}`,
            brand: formData.brand,
            model_number: formData.model_number,
            category: formData.category,
            condition: formData.condition,
            wattage: formData.wattage,
            voltage: formData.voltage,
            phase: formData.phase,
            cost_price: formData.cost_price,
            selling_price: formData.selling_price,
            notes: formData.specs
          })
          .select()
          .single()

        if (productError) throw productError

        // Create inventory record
        const { error: invError } = await supabase
          .from("inventory")
          .insert({
            product_id: newProduct.id,
            warehouse: formData.warehouse,
            quantity: formData.quantity,
            min_stock: formData.min_stock,
            rack_number: formData.rack_number
          })

        if (invError) throw invError

        alert("Product added successfully!")
      }

      resetForm()
      fetchInventory()
    } catch (error) {
      console.error("Error saving product:", error)
      alert("Error saving product: " + error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      brand: "",
      model_number: "",
      category: "Servo Motors",
      condition: "New",
      wattage: "",
      voltage: "",
      phase: "Single",
      quantity: 0,
      min_stock: 5,
      cost_price: 0,
      selling_price: 0,
      warehouse: warehouseFilter,
      rack_number: "",
      specs: "",
    })
    setEditingProduct(null)
    setShowModal(false)
  }

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      sku: product.sku,
      brand: product.brand || "",
      model_number: product.model_number || "",
      category: product.category || "Servo Motors",
      quantity: product.quantity,
      min_stock: product.min_stock,
      cost_price: product.cost_price,
      selling_price: product.selling_price,
      warehouse: product.warehouse,
      rack_number: product.rack_number || "",
      specs: product.notes || "",
    })
    setEditingProduct(product)
    setShowModal(true)
  }

  const handleDelete = async (inventory_id, product_id) => {
    if (confirm("Are you sure you want to delete this product from inventory?")) {
      try {
        // Just delete from inventory for this warehouse. 
        // If you want to delete the product completely, you'd delete from products table.
        const { error } = await supabase.from("inventory").delete().eq("id", inventory_id)
        if (error) throw error
        
        fetchInventory()
      } catch (error) {
        alert("Error deleting: " + error.message)
      }
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !categoryFilter || product.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="mt-2 text-gray-600">Manage your products and stock levels across warehouses</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products by Name, SKU, or Brand..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364] focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="sm:w-48">
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={warehouseFilter}
                  onChange={(e) => setWarehouseFilter(e.target.value)}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364] focus:border-transparent font-medium text-blue-800 bg-blue-50"
                >
                  {warehouses.map((w) => (
                    <option key={w} value={w}>{w} Warehouse</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sm:w-48">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364] focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Selling Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.inventory_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-bold text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-500">
                          SKU: {product.sku} | {product.brand} - {product.model_number}
                        </div>
                        <div className="flex gap-1 mt-1">
                          {product.condition && <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${product.condition === 'New' ? 'bg-green-100 text-green-700' : product.condition === 'Used' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{product.condition}</span>}
                          {product.wattage && <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">{product.wattage}W</span>}
                          {product.voltage && <span className="text-xs px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded">{product.voltage}V</span>}
                          {product.phase && <span className="text-xs px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded">{product.phase} Phase</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.warehouse}</div>
                      <div className="text-xs text-gray-500">Rack: {product.rack_number || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.quantity <= product.min_stock
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {product.quantity} units
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Rs {Number(product.cost_price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      Rs {Number(product.selling_price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-900">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(product.inventory_id, product.id)} className="text-red-600 hover:text-red-900">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No products found in {warehouseFilter} Warehouse.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Basic Info */}
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest border-b pb-1">Basic Info</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SKU / Item Code</label>
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364]"
                        placeholder="Leave blank to auto-generate"
                        disabled={!!editingProduct} // Cannot change SKU after creation
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Model Number</label>
                      <input
                        type="text"
                        value={formData.model_number}
                        onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364]"
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
                      <select
                        value={formData.warehouse}
                        onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364] bg-blue-50 font-semibold"
                        disabled={!!editingProduct} // Cannot change warehouse of existing record
                      >
                        {warehouses.map((w) => (
                          <option key={w} value={w}>{w}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rack Number</label>
                      <input
                        type="text"
                        value={formData.rack_number}
                        onChange={(e) => setFormData({ ...formData, rack_number: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: Number.parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364]"
                        min="0" required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock Alert</label>
                      <input
                        type="number"
                        value={formData.min_stock}
                        onChange={(e) => setFormData({ ...formData, min_stock: Number.parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364]"
                        min="0" required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (Rs)</label>
                      <input
                        type="number" step="0.01"
                        value={formData.cost_price}
                        onChange={(e) => setFormData({ ...formData, cost_price: Number.parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364]"
                        min="0" required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (Rs)</label>
                      <input
                        type="number" step="0.01"
                        value={formData.selling_price}
                        onChange={(e) => setFormData({ ...formData, selling_price: Number.parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364]"
                        min="0" required
                      />
                    </div>
                  </div>

                  {/* Technical Specs */}
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest border-b pb-1 mt-2">Technical Specifications</p>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                      <select value={formData.condition} onChange={(e) => setFormData({ ...formData, condition: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364]">
                        <option value="New">New</option>
                        <option value="Used">Used</option>
                        <option value="Old">Old</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Wattage (W)</label>
                      <input type="text" value={formData.wattage} onChange={(e) => setFormData({ ...formData, wattage: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364]" placeholder="e.g. 500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Voltage (V)</label>
                      <input type="text" value={formData.voltage} onChange={(e) => setFormData({ ...formData, voltage: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364]" placeholder="e.g. 220" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
                      <select value={formData.phase} onChange={(e) => setFormData({ ...formData, phase: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364]">
                        <option value="Single">Single Phase</option>
                        <option value="Double">Double Phase</option>
                        <option value="Three">Three Phase</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea value={formData.specs} onChange={(e) => setFormData({ ...formData, specs: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364]" placeholder="Any additional notes..." />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" onClick={resetForm} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      {editingProduct ? "Update Product" : "Add Product"}
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
