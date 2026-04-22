import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react'
import { useProducts, useCustomers, useTransactions } from '../hooks/useSupabase'
import './SalesDashboard.css'
import './NewTransaction.css'

const NewTransaction = () => {
  const navigate = useNavigate()
  const { products } = useProducts()
  const { customers } = useCustomers()
  const { createTransaction } = useTransactions()

  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [cart, setCart] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('Tunai')
  const [notes, setNotes] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.brand.toLowerCase().includes(productSearch.toLowerCase())
  )

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id)
      if (existing) {
        return prev.map(i => i.product_id === product.id
          ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unit_price }
          : i)
      }
      return [...prev, { product_id: product.id, name: product.name, brand: product.brand,
        unit_price: product.price, quantity: 1, subtotal: product.price }]
    })
  }

  const updateQty = (productId, delta) => {
    setCart(prev => prev
      .map(i => i.product_id === productId
        ? { ...i, quantity: i.quantity + delta, subtotal: (i.quantity + delta) * i.unit_price }
        : i)
      .filter(i => i.quantity > 0))
  }

  const total = cart.reduce((s, i) => s + i.subtotal, 0)

  const handleSubmit = async () => {
    if (cart.length === 0) return
    setSaving(true)
    const { data, error } = await createTransaction({
      customer_id: selectedCustomer || null,
      items: cart,
      payment_method: paymentMethod,
      notes,
    })
    setSaving(false)
    if (!error && data) {
      navigate(`/transactions/${data.id}`)
    }
  }

  return (
    <div className="dashboard-container fade-in">
      <header className="detail-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={22} /></button>
        <h2>Transaksi Baru</h2>
        <div style={{ width: 40 }} />
      </header>

      <div className="page-content pos-layout">
        {/* Customer Select */}
        <section className="pos-section card-elevation">
          <h4>Pilih Pelanggan</h4>
          <select className="pos-select" value={selectedCustomer}
            onChange={e => setSelectedCustomer(e.target.value)}>
            <option value="">Pelanggan Umum / Walk-in</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
            ))}
          </select>
        </section>

        {/* Product Search */}
        <section className="pos-section">
          <h4>Tambah Produk</h4>
          <div className="search-input-wrapper card-elevation" style={{ marginBottom: 12 }}>
            <Search size={18} className="search-icon" />
            <input className="search-input" placeholder="Cari produk AC..."
              value={productSearch} onChange={e => setProductSearch(e.target.value)} />
          </div>
          <div className="product-list-pos">
            {filteredProducts.map(p => (
              <div key={p.id} className={`product-pos-item card-elevation ${p.stock === 0 ? 'out-of-stock' : ''}`}>
                <div className="product-pos-info">
                  <span className="product-pos-name">{p.brand} {p.name}</span>
                  <span className="product-pos-price">Rp {p.price.toLocaleString('id-ID')}</span>
                  <span className="product-pos-stock">Stok: {p.stock}</span>
                </div>
                <button className="add-cart-btn" onClick={() => addToCart(p)} disabled={p.stock === 0}>
                  <Plus size={18} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Cart */}
        {cart.length > 0 && (
          <section className="pos-section card-elevation">
            <h4>Keranjang ({cart.length} item)</h4>
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.product_id} className="cart-item">
                  <div className="cart-item-info">
                    <span className="cart-item-name">{item.brand} {item.name}</span>
                    <span className="cart-item-price">Rp {item.unit_price.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="cart-qty-controls">
                    <button onClick={() => updateQty(item.product_id, -1)}><Minus size={14} /></button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQty(item.product_id, 1)}><Plus size={14} /></button>
                  </div>
                  <span className="cart-subtotal">Rp {item.subtotal.toLocaleString('id-ID')}</span>
                  <button className="cart-remove" onClick={() => setCart(c => c.filter(i => i.product_id !== item.product_id))}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Payment */}
        <section className="pos-section card-elevation">
          <h4>Metode Pembayaran</h4>
          <div className="payment-methods">
            {['Tunai', 'Transfer Bank', 'QRIS'].map(method => (
              <button key={method}
                className={`payment-btn ${paymentMethod === method ? 'active' : ''}`}
                onClick={() => setPaymentMethod(method)}>
                {method === 'Tunai' ? '💵' : method === 'Transfer Bank' ? '🏦' : '📱'} {method}
              </button>
            ))}
          </div>
          <div className="form-group" style={{ marginTop: 12 }}>
            <label>Catatan (opsional)</label>
            <textarea className="modal-input modal-textarea" placeholder="Catatan transaksi..."
              value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
        </section>
      </div>

      {/* Bottom Action */}
      <div className="pos-footer">
        <div className="pos-total">
          <span>Total</span>
          <span className="pos-total-amount">Rp {total.toLocaleString('id-ID')}</span>
        </div>
        <button className="pos-submit-btn" onClick={handleSubmit}
          disabled={cart.length === 0 || saving}>
          <ShoppingCart size={18} />
          {saving ? 'Menyimpan...' : 'Simpan Transaksi'}
        </button>
      </div>
    </div>
  )
}

export default NewTransaction
