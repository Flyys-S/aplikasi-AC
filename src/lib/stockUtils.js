import { supabase } from './supabase';

/**
 * Mengurangi stok produk menggunakan operasi atomik di sisi database (via RPC).
 * Ini mencegah terjadinya Race Condition apabila ada beberapa pesanan bersamaan.
 * 
 * @param {Array<{product_id: string, quantity: number}>} items - Array dari produk yang dipesan
 * @returns {Promise<{success: boolean, errors: Array}>}
 */
export const decrementStockBatch = async (items) => {
  const errors = [];

  for (const item of items) {
    const { error: rpcError } = await supabase.rpc('decrement_stock', {
      product_id: item.product_id,
      amount: item.quantity,
    });

    if (rpcError) {
      console.error(`Error decrementing stock for product ${item.product_id}:`, rpcError);
      errors.push({ product_id: item.product_id, error: rpcError.message });
    }
  }

  return { success: errors.length === 0, errors };
};
