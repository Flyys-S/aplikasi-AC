/* eslint-disable react-refresh/only-export-components, react-hooks/exhaustive-deps */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(() => localStorage.getItem('supabase_user_role') || null)
  const [loading, setLoading] = useState(true)

  const fetchUserRole = useCallback(async (userId) => {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout fetching role')), 5000)
    );

    try {
      const rolePromise = supabase.rpc('get_user_role', { user_id: userId });
      const { data, error } = await Promise.race([rolePromise, timeoutPromise]);
      
      if (error) {
        console.error('Error fetching user role via RPC:', error)
        const cachedRole = localStorage.getItem('supabase_user_role')
        if (!cachedRole) {
          setRole('visitor')
        }
      } else {
        const userRole = data || 'visitor'
        setRole(userRole)
        localStorage.setItem('supabase_user_role', userRole)
      }
    } catch (err) {
      console.error('Fetch role failed or timed out:', err.message)
      const cachedRole = localStorage.getItem('supabase_user_role')
      if (!cachedRole) {
        setRole('visitor')
      }
    } finally {
      setLoading(false)
    }
  }, []);

  useEffect(() => {
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setUser(session.user)
          await fetchUserRole(session.user.id)
        } else {
          if (window.location.hash.includes('error=')) {
            console.error('Auth error in hash:', window.location.hash)
          }
          setLoading(false)
        }
      } catch (err) {
        console.error('Session check failed:', err)
        setLoading(false)
      }
    }

    checkInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change event:', event, session?.user?.email)
      
      if (session?.user) {
        setUser(session.user)
        await fetchUserRole(session.user.id)
      } else {
        setUser(null)
        setRole(null)
        localStorage.removeItem('supabase_user_role')
        setLoading(false)
      }
    })

    return () => {
      if (subscription) subscription.unsubscribe()
    }
  }, [fetchUserRole])

  const signInWithGoogle = async () => {
    try {
      const baseUrl = window.location.origin + import.meta.env.BASE_URL
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: baseUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Google Sign-In Error:', error)
      toast.error('Gagal login: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    localStorage.removeItem('supabase_user_role')
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      role, 
      isAdmin: role === 'admin',
      isTechnician: role === 'technician',
      loading, 
      signInWithGoogle, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  )
}
