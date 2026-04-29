"use client"

import { useState, useEffect } from "react"
import Layout from "../components/Layout"
import { ArrowRightLeft, Building2, Package } from "lucide-react"
import { supabase } from "../../lib/supabase"

export default function Transfer() {
  const [products, setProducts] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ product_id: "", inventory_id: "", from_warehouse: "Nazimabad", to_warehouse: "SITE", quantity: 1, notes: "" })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    // Fetch all inventory with product details
    const { data: inv } = await supabase.from("inventory").select("*, products(id, name, sku)").order("created_at")
    setProducts(inv || [])

    // Fetch movement history
    const { data: hist } = await supabase.from("stock_movements").select("*, products(name)").order("created_at", { ascending: false }).limit(30)
    setMovements(hist || [])
  }

  const fromItems = products.filter(p => p.warehouse === formData.from_warehouse)
  const selectedItem = products.find(p => p.id === formData.inventory_id)

  const handleTransfer = async (e) => {
    e.preventDefault()
    if (!formData.inventory_id) return alert("Please select a product.")
    if (formData.from_warehouse === formData.to_warehouse) return alert("Source and destination warehouse must be different.")
    if (!selectedItem) return alert("Product not found.")
    if (formData.quantity > selectedItem.quantity) return alert(`Only ${selectedItem.quantity} units available in ${formData.from_warehouse}.`)
    if (formData.quantity <= 0) return alert("Quantity must be greater than 0.")

    setLoading(true)
    try {
      // 1. Deduct from source warehouse
      const { error: deductErr } = await supabase.from("inventory").update({ quantity: selectedItem.quantity - formData.quantity }).eq("id", formData.inventory_id)
      if (deductErr) throw deductErr

      // 2. Check if destination already has this product
      const { data: destItem } = await supabase.from("inventory").select("*").eq("product_id", selectedItem.products.id).eq("warehouse", formData.to_warehouse).single()

      if (destItem) {
        // Add to existing record
        const { error: addErr } = await supabase.from("inventory").update({ quantity: destItem.quantity + formData.quantity }).eq("id", destItem.id)
        if (addErr) throw addErr
      } else {
        // Create new inventory record in destination
        const { error: createErr } = await supabase.from("inventory").insert({ product_id: selectedItem.products.id, warehouse: formData.to_warehouse, quantity: formData.quantity, min_stock: selectedItem.min_stock || 5 })
        if (createErr) throw createErr
      }

      // 3. Log movement
      await supabase.from("stock_movements").insert({
        product_id: selectedItem.products.id,
        from_warehouse: formData.from_warehouse,
        to_warehouse: formData.to_warehouse,
        quantity: formData.quantity,
        movement_type: "transfer",
        notes: formData.notes
      })

      alert(`✅ ${formData.quantity} units of "${selectedItem.products.name}" transferred from ${formData.from_warehouse} to ${formData.to_warehouse}!`)
      setFormData(prev => ({ ...prev, inventory_id: "", quantity: 1, notes: "" }))
      fetchData()
    } catch (err) {
      alert("Transfer failed: " + err.message)
    }
    setLoading(false)
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inter-Warehouse Transfer</h1>
          <p className="mt-2 text-gray-600">Transfer stock between Nazimabad and SITE warehouses</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transfer Form */}
          <div className="card bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><ArrowRightLeft className="w-5 h-5 text-blue-600" /> New Transfer</h3>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Warehouse</label>
                  <select value={formData.from_warehouse} onChange={e => setFormData({ ...formData, from_warehouse: e.target.value, inventory_id: "" })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2C5364] bg-red-50 font-semibold text-red-800">
                    <option value="Nazimabad">Nazimabad</option>
                    <option value="SITE">SITE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Warehouse</label>
                  <select value={formData.to_warehouse} onChange={e => setFormData({ ...formData, to_warehouse: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2C5364] bg-green-50 font-semibold text-green-800">
                    <option value="SITE">SITE</option>
                    <option value="Nazimabad">Nazimabad</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1"><Package className="w-4 h-4 inline mr-1" />Select Product (from {formData.from_warehouse})</label>
                <select value={formData.inventory_id} onChange={e => setFormData({ ...formData, inventory_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2C5364]" required>
                  <option value="">-- Select Product --</option>
                  {fromItems.map(item => (
                    <option key={item.id} value={item.id}>{item.products?.name} ({item.products?.sku}) — Available: {item.quantity}</option>
                  ))}
                </select>
                {selectedItem && (
                  <p className="text-xs text-blue-600 mt-1 font-medium">Available in {formData.from_warehouse}: {selectedItem.quantity} units</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Quantity</label>
                <input type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })} min="1" max={selectedItem?.quantity || undefined} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2C5364]" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <input type="text" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2C5364]" placeholder="Reason for transfer..." />
              </div>

              <button type="submit" disabled={loading} className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50">
                <ArrowRightLeft className="w-4 h-4" />
                {loading ? "Transferring..." : "Execute Transfer"}
              </button>
            </form>
          </div>

          {/* Transfer History */}
          <div className="card bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Transfer History</h3>
            <div className="space-y-3 max-h-[450px] overflow-y-auto">
              {movements.length > 0 ? movements.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border text-sm">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{m.products?.name || "Product"}</p>
                    <p className="text-gray-500 text-xs">{new Date(m.created_at).toLocaleDateString()} {new Date(m.created_at).toLocaleTimeString()}</p>
                    {m.notes && <p className="text-gray-400 text-xs italic">{m.notes}</p>}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs font-medium">
                      <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded">{m.from_warehouse}</span>
                      <ArrowRightLeft className="w-3 h-3 text-gray-400" />
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">{m.to_warehouse}</span>
                    </div>
                    <p className="font-bold text-gray-900 mt-1">{m.quantity} units</p>
                  </div>
                </div>
              )) : <p className="text-center text-gray-500 py-8">No transfers yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
