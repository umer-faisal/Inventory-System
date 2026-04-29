"use client"

import { useState, useEffect } from "react"
import Layout from "../components/Layout"
import { Plus, Building2 } from "lucide-react"
import { supabase } from "../../lib/supabase"

export default function Purchases() {
  const [inventory, setInventory] = useState([])
  const [purchases, setPurchases] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ supplier: "", warehouse: "Nazimabad", items: [] })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: inv } = await supabase.from("inventory").select("*, products(id, name, sku, cost_price)").order("created_at")
    setInventory(inv || [])

    const { data: hist } = await supabase.from("stock_movements").select("*, products(name)").eq("movement_type", "stock_in").order("created_at", { ascending: false }).limit(50)
    setPurchases(hist || [])
  }

  const addItem = () => setFormData({ ...formData, items: [...formData.items, { inventory_id: "", product_id: "", quantity: 1, cost: 0 }] })
  const removeItem = (i) => setFormData({ ...formData, items: formData.items.filter((_, idx) => idx !== i) })

  const updateItem = (index, field, value) => {
    const items = formData.items.map((item, i) => {
      if (i !== index) return item
      const updated = { ...item, [field]: value }
      if (field === "inventory_id" && value) {
        const inv = inventory.find(p => p.id === value)
        if (inv) { updated.product_id = inv.products.id; updated.cost = inv.products.cost_price }
      }
      return updated
    })
    setFormData({ ...formData, items })
  }

  const calcTotal = () => formData.items.reduce((s, i) => s + i.quantity * i.cost, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.items.length === 0) return alert("Add at least one item.")
    if (!formData.supplier.trim()) return alert("Supplier name is required.")

    try {
      for (const item of formData.items) {
        const invItem = inventory.find(p => p.id === item.inventory_id)
        if (!invItem) continue

        // Add stock to inventory
        const { error } = await supabase.from("inventory").update({ quantity: invItem.quantity + item.quantity }).eq("id", item.inventory_id)
        if (error) throw error

        // Log as stock_in movement
        await supabase.from("stock_movements").insert({
          product_id: invItem.products.id,
          to_warehouse: formData.warehouse,
          quantity: item.quantity,
          movement_type: "stock_in",
          notes: `Purchase from ${formData.supplier}`
        })
      }

      alert("Purchase recorded and stock updated!")
      setFormData({ supplier: "", warehouse: "Nazimabad", items: [] })
      setShowModal(false)
      fetchData()
    } catch (err) { alert("Error: " + err.message) }
  }

  const warehouseItems = inventory.filter(i => i.warehouse === formData.warehouse)

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Purchase / Stock In</h1>
            <p className="mt-2 text-gray-600">Record new stock purchases — automatically adds to warehouse inventory</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-5 h-5" /> New Purchase</button>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase History (Stock Ins)</h3>
          {purchases.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty Added</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchases.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{p.products?.name || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{p.to_warehouse}</td>
                      <td className="px-4 py-3"><span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">+{p.quantity}</span></td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{p.notes?.replace("Purchase from ", "") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-center text-gray-500 py-8">No purchases recorded yet.</p>}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-xl font-bold mb-4 border-b pb-2">New Purchase / Stock In</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                    <input type="text" value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2C5364]" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1"><Building2 className="w-4 h-4 inline mr-1" />Warehouse</label>
                    <select value={formData.warehouse} onChange={e => setFormData({ ...formData, warehouse: e.target.value, items: [] })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2C5364] bg-blue-50 font-semibold">
                      <option value="Nazimabad">Nazimabad</option>
                      <option value="SITE">SITE</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Items</label>
                    <button type="button" onClick={addItem} className="btn-secondary text-xs">+ Add Item</button>
                  </div>
                  {formData.items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 mb-2 p-2 border rounded-lg">
                      <div className="col-span-6">
                        <select value={item.inventory_id} onChange={e => updateItem(i, "inventory_id", e.target.value)} className="w-full px-2 py-2 border rounded text-sm" required>
                          <option value="">Select Product...</option>
                          {warehouseItems.map(inv => <option key={inv.id} value={inv.id}>{inv.products?.name} ({inv.products?.sku})</option>)}
                        </select>
                      </div>
                      <div className="col-span-2"><input type="number" value={item.quantity} onChange={e => updateItem(i, "quantity", parseInt(e.target.value)||0)} placeholder="Qty" min="1" className="w-full px-2 py-2 border rounded text-sm" required /></div>
                      <div className="col-span-2"><input type="number" value={item.cost} onChange={e => updateItem(i, "cost", parseFloat(e.target.value)||0)} placeholder="Cost" step="0.01" min="0" className="w-full px-2 py-2 border rounded text-sm" required /></div>
                      <div className="col-span-2 flex items-center justify-between text-xs">
                        <span className="font-bold">Rs {(item.quantity * item.cost).toLocaleString()}</span>
                        <button type="button" onClick={() => removeItem(i)} className="text-red-500 font-bold">✕</button>
                      </div>
                    </div>
                  ))}
                  {formData.items.length === 0 && <p className="text-center text-gray-400 text-sm border-2 border-dashed rounded-lg p-4">No items. Click "+ Add Item".</p>}
                </div>

                <div className="border-t pt-3 text-right">
                  <p className="text-lg font-bold">Total Cost: Rs {calcTotal().toLocaleString()}</p>
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => { setShowModal(false); setFormData({ supplier: "", warehouse: "Nazimabad", items: [] }) }} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">Record Purchase</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
