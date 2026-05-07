import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

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
      console.log('Fetching role for user:', userId)
      
      const rolePromise = supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([rolePromise, timeoutPromise]);
      
      if (error) {
        console.error('Error fetching user role:', error)
        setRole('visitor')
      } else {
        console.log('User role fetched successfully:', data?.role)
        setRole(data?.role || 'visitor')
      }
    } catch (err) {
      console.error('Fetch role failed or timed out:', err.message)
      setRole('visitor') // Fallback to visitor so app doesn't hang
    } finally {
      console.log('Role fetching process completed, setting loading to false')
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial check
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Initial session check:', session?.user?.email)
        
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

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state change event:', _event)
      
      if (session?.user) {
        setUser(session.user)
        // Only fetch role if we don't have it or if it's a new sign in
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
      console.log('Signing in with Google, redirecting to:', baseUrl)
      
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
      console.error('Error signing in with Google:', error.message)
      alert('Gagal login: ' + error.message)
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
