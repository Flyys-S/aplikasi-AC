import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export const useProducts = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name')
    if (error) setError(error)
    else setProducts(data)
    setLoading(false)
  }

  const updateStock = async (productId, newStock) => {
    const { error } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId)
    if (!error) fetchProducts()
    return { error }
  }

  useEffect(() => { fetchProducts() }, [])

  return { products, loading, error, fetchProducts, updateStock }
}

export const useCustomers = () => {
  const { user } = useAuth()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCustomers = async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name')
    if (error) setError(error)
    else setCustomers(data)
    setLoading(false)
  }

  const createCustomer = async (customerData) => {
    const { data, error } = await supabase
      .from('customers')
      .insert([{ ...customerData, user_id: user.id }])
      .select()
      .single()
    if (!error) fetchCustomers()
    return { data, error }
  }

  const updateCustomer = async (id, customerData) => {
    const { data, error } = await supabase
      .from('customers')
      .update(customerData)
      .eq('id', id)
      .select()
      .single()
    if (!error) fetchCustomers()
    return { data, error }
  }

  useEffect(() => { fetchCustomers() }, [user])

  return { customers, loading, error, fetchCustomers, createCustomer, updateCustomer }
}

export const useTransactions = () => {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTransactions = async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        customers (name, phone),
        transaction_items (
          *,
          products (name, brand)
        )
      `)
      .order('created_at', { ascending: false })
    if (error) setError(error)
    else setTransactions(data)
    setLoading(false)
  }

  const createTransaction = async ({ customer_id, items, payment_method, notes }) => {
    // 1. Insert transaction
    const total_amount = items.reduce((sum, item) => sum + item.subtotal, 0)
    const { data: txn, error: txnError } = await supabase
      .from('transactions')
      .insert([{
        user_id: user.id,
        customer_id,
        total_amount,
        payment_method,
        status: 'completed',
        notes,
      }])
      .select()
      .single()
    if (txnError) return { error: txnError }

    // 2. Insert transaction items
    const itemsPayload = items.map(item => ({
      transaction_id: txn.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
    }))
    const { error: itemsError } = await supabase
      .from('transaction_items')
      .insert(itemsPayload)
    if (itemsError) return { error: itemsError }

    // 3. Update stock for each product
    for (const item of items) {
      await supabase.rpc('decrement_stock', {
        product_id: item.product_id,
        amount: item.quantity,
      }).catch(() => {
        // Fallback: manual update
        supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single()
          .then(({ data }) => {
            if (data) {
              supabase
                .from('products')
                .update({ stock: Math.max(0, data.stock - item.quantity) })
                .eq('id', item.product_id)
            }
          })
      })
    }

    fetchTransactions()
    return { data: txn, error: null }
  }

  useEffect(() => { fetchTransactions() }, [user])

  return { transactions, loading, error, fetchTransactions, createTransaction }
}

export const useServiceOrders = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('service_orders')
      .select('*, customers(name, phone)')
      .order('scheduled_date', { ascending: true })
    if (!error) setOrders(data)
    setLoading(false)
  }

  const createOrder = async (orderData) => {
    const { data, error } = await supabase
      .from('service_orders')
      .insert([{ ...orderData, user_id: user.id }])
      .select()
      .single()
    if (!error) fetchOrders()
    return { data, error }
  }

  const updateOrderStatus = async (id, status) => {
    const { error } = await supabase
      .from('service_orders')
      .update({ status })
      .eq('id', id)
    if (!error) fetchOrders()
    return { error }
  }

  useEffect(() => { fetchOrders() }, [user])

  return { orders, loading, fetchOrders, createOrder, updateOrderStatus }
}
