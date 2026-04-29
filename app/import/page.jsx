"use client"

import { useState } from "react"
import Layout from "../components/Layout"
import { Upload, Download, CheckCircle, AlertTriangle, FileSpreadsheet } from "lucide-react"
import { supabase } from "../../lib/supabase"

export default function ImportPage() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState([])
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState(null)
  const [warehouse, setWarehouse] = useState("Nazimabad")

  const EXPECTED_HEADERS = ["name", "sku", "brand", "model_number", "category", "condition", "wattage", "voltage", "phase", "cost_price", "selling_price", "quantity", "min_stock", "rack_number", "notes"]

  const downloadTemplate = () => {
    const headers = EXPECTED_HEADERS.join(",")
    const sampleRow = "Servo Motor 500W,SKU-001,Siemens,SM-500,Servo Motors,New,500,220,Three,15000,20000,10,2,A1,Good condition"
    const csvContent = `${headers}\n${sampleRow}`
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "inventory_import_template.csv"
    a.click()
  }

  const parseCSV = (text) => {
    const lines = text.trim().split("\n")
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/ /g, "_"))
    return lines.slice(1).filter(l => l.trim()).map(line => {
      const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""))
      const obj = {}
      headers.forEach((h, i) => { obj[h] = values[i] || "" })
      return obj
    })
  }

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setResults(null)
    const reader = new FileReader()
    reader.onload = (event) => {
      const rows = parseCSV(event.target.result)
      setPreview(rows.slice(0, 5))
    }
    reader.readAsText(f)
  }

  const handleImport = async () => {
    if (!file) return alert("Please select a CSV file first.")
    setImporting(true)
    setResults(null)

    const reader = new FileReader()
    reader.onload = async (event) => {
      const rows = parseCSV(event.target.result)
      let success = 0, failed = 0, errors = []

      for (const row of rows) {
        try {
          if (!row.name) { failed++; errors.push(`Row skipped: missing product name`); continue }

          // Insert product
          const { data: product, error: productErr } = await supabase.from("products").upsert({
            name: row.name,
            sku: row.sku || `SKU-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
            brand: row.brand || "",
            model_number: row.model_number || "",
            category: row.category || "Other",
            condition: ["New","Used","Old"].includes(row.condition) ? row.condition : "New",
            wattage: row.wattage || "",
            voltage: row.voltage || "",
            phase: ["Single","Double","Three"].includes(row.phase) ? row.phase : "Single",
            cost_price: parseFloat(row.cost_price) || 0,
            selling_price: parseFloat(row.selling_price) || 0,
            notes: row.notes || ""
          }, { onConflict: "sku" }).select().single()

          if (productErr) throw productErr

          // Insert inventory record
          const { error: invErr } = await supabase.from("inventory").upsert({
            product_id: product.id,
            warehouse: warehouse,
            quantity: parseInt(row.quantity) || 0,
            min_stock: parseInt(row.min_stock) || 5,
            rack_number: row.rack_number || ""
          }, { onConflict: "product_id,warehouse" })

          if (invErr) throw invErr
          success++
        } catch (err) {
          failed++
          errors.push(`"${row.name}": ${err.message}`)
        }
      }
      setResults({ success, failed, errors, total: rows.length })
      setImporting(false)
    }
    reader.readAsText(file)
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Import Inventory</h1>
          <p className="mt-2 text-gray-600">Bulk import products from Excel/CSV file — SRS Clause 12</p>
        </div>

        {/* Instructions */}
        <div className="card bg-blue-50 border border-blue-200 p-5 rounded-xl">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2"><FileSpreadsheet className="w-5 h-5" /> How to Import</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Download the template CSV file below.</li>
            <li>Fill in your product data in Excel or Google Sheets (keep headers exactly as is).</li>
            <li>Save/export as CSV format.</li>
            <li>Select target warehouse, upload file, and click Import.</li>
          </ol>
          <button onClick={downloadTemplate} className="mt-3 flex items-center gap-2 text-sm bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition">
            <Download className="w-4 h-4" /> Download Template CSV
          </button>
        </div>

        {/* Upload Section */}
        <div className="card p-6 rounded-xl bg-white shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Warehouse</label>
              <select value={warehouse} onChange={e => setWarehouse(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2C5364] font-semibold bg-blue-50">
                <option value="Nazimabad">Nazimabad Warehouse</option>
                <option value="SITE">SITE Warehouse</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload CSV File</label>
              <input type="file" accept=".csv" onChange={handleFileChange} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium hover:file:bg-blue-100" />
            </div>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Preview (first 5 rows):</p>
              <div className="overflow-x-auto border rounded-lg">
                <table className="text-xs min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>{Object.keys(preview[0]).map(h => <th key={h} className="px-3 py-2 text-left text-gray-500 font-medium">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {preview.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {Object.values(row).map((v, j) => <td key={j} className="px-3 py-2 text-gray-700 whitespace-nowrap">{v || "—"}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button onClick={handleImport} disabled={!file || importing} className="btn-primary px-8 py-3 flex items-center gap-2 disabled:opacity-50">
            <Upload className="w-4 h-4" />
            {importing ? "Importing..." : "Import to Supabase"}
          </button>
        </div>

        {/* Results */}
        {results && (
          <div className={`card p-5 rounded-xl border-2 ${results.failed === 0 ? 'border-green-300 bg-green-50' : 'border-yellow-300 bg-yellow-50'}`}>
            <div className="flex items-center gap-2 mb-3">
              {results.failed === 0 ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-yellow-600" />}
              <h3 className="font-bold text-gray-900">Import Complete</h3>
            </div>
            <p className="text-sm text-gray-700">Total Rows: <strong>{results.total}</strong> | ✅ Imported: <strong className="text-green-700">{results.success}</strong> | ❌ Failed: <strong className="text-red-600">{results.failed}</strong></p>
            {results.errors.length > 0 && (
              <div className="mt-3 space-y-1">
                {results.errors.map((err, i) => <p key={i} className="text-xs text-red-700 bg-red-50 px-3 py-1 rounded">⚠️ {err}</p>)}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
