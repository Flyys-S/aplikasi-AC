/* eslint-disable react-refresh/only-export-components, react-hooks/exhaustive-deps */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

const cleanAuthUrlParams = () => {
  try {
    const url = new URL(window.location.href)
    let changed = false
    
    // Clear auth query params
    const paramsToDelete = ['code', 'state', 'error', 'error_code', 'error_description']
    paramsToDelete.forEach(param => {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param)
        changed = true
      }
    })

    // Clear empty or trailing hash
    if (window.location.hash === '#' || window.location.hash === '#/' || window.location.hash === '') {
      if (window.location.href.endsWith('#') || window.location.href.endsWith('#/')) {
        url.hash = ''
        changed = true
      }
    }

    if (changed) {
      const cleanUrl = url.searchParams.toString()
        ? `${url.pathname}?${url.searchParams.toString()}${url.hash}`
        : `${url.pathname}${url.hash}`
      window.history.replaceState(null, '', cleanUrl)
    }
  } catch (err) {
    console.error('Failed to clean URL auth params:', err)
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(() => localStorage.getItem('supabase_user_role') || null)
  const [profile, setProfile] = useState(null)
  const [isBioComplete, setIsBioComplete] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, full_name, phone, address')
        .eq('id', userId)
        .single()

      if (error) throw error
      if (data) {
        setRole(data.role || 'visitor')
        localStorage.setItem('supabase_user_role', data.role || 'visitor')
        setProfile(data)
        const complete = !!(data.full_name?.trim() && data.phone?.trim() && data.address?.trim())
        setIsBioComplete(complete)
      } else {
        setRole('visitor')
        setIsBioComplete(false)
      }
    } catch (err) {
      console.error('Error fetching user profile:', err.message)
      const cachedRole = localStorage.getItem('supabase_user_role')
      setRole(cachedRole || 'visitor')
      setIsBioComplete(false)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchUserProfile(user.id)
    }
  }, [user, fetchUserProfile])

  useEffect(() => {
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)
          await fetchUserProfile(session.user.id)
          cleanAuthUrlParams()
        } else {
          // Handle error query params from failed OAuth sign-in
          const params = new URLSearchParams(window.location.search)
          const errorMsg = params.get('error_description') || params.get('error')
          if (errorMsg) {
            console.error('Auth error in query params:', errorMsg)
            toast.error('Gagal login: ' + decodeURIComponent(errorMsg).replace(/\+/g, ' '))
            cleanAuthUrlParams()
          }
          if (window.location.hash.includes('error=')) {
            console.error('Auth error in hash:', window.location.hash)
            // Clear hash
            window.history.replaceState(null, '', window.location.pathname)
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
        await fetchUserProfile(session.user.id)
        cleanAuthUrlParams()
      } else {
        setUser(null)
        setRole(null)
        setProfile(null)
        setIsBioComplete(false)
        localStorage.removeItem('supabase_user_role')
        setLoading(false)
      }
    })

    return () => {
      if (subscription) subscription.unsubscribe()
    }
  }, [fetchUserProfile])

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
      signOut,
      profile,
      isBioComplete,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}
