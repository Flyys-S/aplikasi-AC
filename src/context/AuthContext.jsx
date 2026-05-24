import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchUserRole = async (userId) => {
    // Add a timeout to prevent hanging forever
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout fetching role')), 5000)
    );

    try {
      // Call RPC function to safely bypass RLS issues and prevent infinite recursion
      const rolePromise = supabase.rpc('get_user_role', { user_id: userId });

      const { data, error } = await Promise.race([rolePromise, timeoutPromise]);
      
      if (error) {
        console.error('Error fetching user role via RPC:', error)
        setRole('visitor')
      } else {
        setRole(data || 'visitor')
      }
    } catch (err) {
      console.error('Fetch role failed or timed out:', err.message)
      setRole('visitor') // Fallback to visitor so app doesn't hang
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial check
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setUser(session.user)
          await fetchUserRole(session.user.id)
        } else {
          // If no session, check if there's an error in the hash (Supabase sometimes leaves it)
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

    // Listen for changes responsively to prevent logging out on INITIAL_SESSION or TOKEN_REFRESHED
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change event:', event, session?.user?.email)
      
      if (session?.user) {
        setUser(session.user)
        await fetchUserRole(session.user.id)
      } else {
        setUser(null)
        setRole(null)
        setLoading(false)
      }
    })

    return () => {
      if (subscription) subscription.unsubscribe()
    }
  }, [])

  const signInWithGoogle = async () => {
    try {
      // Back to clean URL, handled by 404.html + BrowserRouter
      const baseUrl = window.location.origin + import.meta.env.BASE_URL
      
      const { data, error } = await supabase.auth.signInWithOAuth({
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
