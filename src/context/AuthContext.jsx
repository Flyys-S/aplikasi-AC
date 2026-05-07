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
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email)
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchUserRole(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchUserRole(session.user.id)
      } else {
        setRole(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    // Construct a clean redirect URL
    const baseUrl = window.location.origin + import.meta.env.BASE_URL
    console.log('Initiating Google sign-in with redirect to:', baseUrl)
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: baseUrl,
      },
    })
    if (error) console.error('Google sign-in error:', error)
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
