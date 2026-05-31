import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const DataContext = createContext({});

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const { role, user } = useAuth();
  
  // Local Memory Cache
  const [productsCache, setProductsCache] = useState([]);
  const [transactionsCache, setTransactionsCache] = useState([]);
  const [servicesCache, setServicesCache] = useState([]);
  
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [transactionsLoaded, setTransactionsLoaded] = useState(false);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. Fetch Products with Cache Checking
  const getProducts = useCallback(async (forceRefresh = false) => {
    if (productsLoaded && !forceRefresh) {
      return productsCache;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('brand', { ascending: true });
        
      if (error) throw error;
      setProductsCache(data || []);
      setProductsLoaded(true);
      return data || [];
    } catch (err) {
      console.error('Error caching products:', err.message);
      return productsCache;
    } finally {
      setLoading(false);
    }
  }, [productsLoaded, productsCache]);

  // 2. Fetch Transactions (Specific to User / Role)
  const getTransactions = useCallback(async (forceRefresh = false) => {
    if (transactionsLoaded && !forceRefresh) {
      return transactionsCache;
    }
    if (!user) return [];
    try {
      setLoading(true);
      let query = supabase.from('transactions').select('*, customers(name), transaction_items(quantity)');
      
      // If Customer, restrict retrieval logic at frontend mockup level
      if (role !== 'admin' && role !== 'technician') {
        // Query simulation or filter
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      
      setTransactionsCache(data || []);
      setTransactionsLoaded(true);
      return data || [];
    } catch (err) {
      console.error('Error caching transactions:', err.message);
      return transactionsCache;
    } finally {
      setLoading(false);
    }
  }, [transactionsLoaded, transactionsCache, user, role]);

  // 3. Fetch Service Jobs
  const getServices = useCallback(async (forceRefresh = false) => {
    if (servicesLoaded && !forceRefresh) {
      return servicesCache;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_jobs')
        .select('*, customers(name, phone, address)')
        .order('scheduled_date', { ascending: true });
        
      if (error) throw error;
      setServicesCache(data || []);
      setServicesLoaded(true);
      return data || [];
    } catch (err) {
      console.error('Error caching service jobs:', err.message);
      return servicesCache;
    } finally {
      setLoading(false);
    }
  }, [servicesLoaded, servicesCache]);

  // Clear memory cache upon sign out
  useEffect(() => {
    if (!user) {
      setProductsCache([]);
      setTransactionsCache([]);
      setServicesCache([]);
      setProductsLoaded(false);
      setTransactionsLoaded(false);
      setServicesLoaded(false);
    }
  }, [user]);

  // 4. WebSocket Mock Event Listener for Instantly Syncing Status across tabs/components
  const broadcastStatusUpdate = useCallback((entityType, id, newStatus) => {
    console.log(`[MOCK WEBSOCKET BROADCAST] ${entityType} #${id} status updated to ${newStatus}`);
    
    if (entityType === 'transaction') {
      setTransactionsCache(prev => prev.map(t => 
        t.id === id ? { ...t, status: newStatus } : t
      ));
    } else if (entityType === 'service') {
      setServicesCache(prev => prev.map(s => 
        s.id === id ? { ...s, status: newStatus } : s
      ));
    }
  }, []);

  return (
    <DataContext.Provider value={{
      products: productsCache,
      transactions: transactionsCache,
      services: servicesCache,
      loading,
      getProducts,
      getTransactions,
      getServices,
      broadcastStatusUpdate
    }}>
      {children}
    </DataContext.Provider>
  );
};
