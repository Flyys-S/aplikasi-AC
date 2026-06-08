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

  const fetchUserProfile = useCallback(async (userId, authUser = null) => {
    console.log('fetchUserProfile started for:', userId)
    
    const timeout = (ms) => new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout koneksi database')), ms)
    )

    try {
      const { data, error } = await Promise.race([
        supabase
          .from('profiles')
          .select('role, full_name, phone, address')
          .eq('id', userId)
          .single(),
        timeout(3500)
      ])

      if (error) {
        console.warn('Profile fetch error, checking code:', error)
        if (error.code === 'PGRST116') {
          console.log('Profile row not found. Auto-creating profile for:', userId)
          const { data: insertedData, error: insertError } = await Promise.race([
            supabase
              .from('profiles')
              .insert([{
                id: userId,
                role: 'visitor',
                email: authUser?.email || '',
                full_name: authUser?.user_metadata?.full_name || '',
                phone: authUser?.user_metadata?.phone || ''
              }])
              .select('role, full_name, phone, address')
              .single(),
            timeout(3500)
          ])

          if (insertError) {
            console.error('Failed to auto-create profile:', insertError)
            throw insertError
          }
          
          if (insertedData) {
            console.log('Profile auto-created successfully:', insertedData)
            setRole(insertedData.role || 'visitor')
            localStorage.setItem('supabase_user_role', insertedData.role || 'visitor')
            setProfile(insertedData)
            const complete = !!(insertedData.full_name?.trim() && insertedData.phone?.trim() && insertedData.address?.trim())
            setIsBioComplete(complete)
            return
          }
        }
        throw error
      }

      if (data) {
        console.log('Profile fetched successfully:', data)
        setRole(data.role || 'visitor')
        localStorage.setItem('supabase_user_role', data.role || 'visitor')
        setProfile(data)
        const complete = !!(data.full_name?.trim() && data.phone?.trim() && data.address?.trim())
        setIsBioComplete(complete)
      } else {
        console.warn('No profile data returned, defaulting to visitor')
        setRole('visitor')
        setIsBioComplete(false)
      }
    } catch (err) {
      console.error('Error fetching user profile:', err)
      const cachedRole = localStorage.getItem('supabase_user_role')
      setRole(cachedRole || 'visitor')
      setIsBioComplete(false)
    } finally {
      console.log('fetchUserProfile finished, setting loading to false')
      setLoading(false)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) {
      console.log('Refreshing profile for user:', user.id)
      await fetchUserProfile(user.id, user)
    }
  }, [user, fetchUserProfile])

  useEffect(() => {
    let active = true
    let fired = false

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change event:', event, session?.user?.email)
      fired = true
      if (!active) return

      if (session?.user) {
        setUser(session.user)
        await fetchUserProfile(session.user.id, session.user)
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

    // Fallback in case onAuthStateChange does not fire on mount for guest users
    const fallbackTimer = setTimeout(async () => {
      if (!fired && active) {
        console.log('onAuthStateChange did not fire, running fallback session check')
        try {
          const sessionResult = await Promise.race([
            supabase.auth.getSession(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Session fetch timeout')), 3000))
          ])
          
          const session = sessionResult?.data?.session
          if (active && !fired) {
            if (session?.user) {
              setUser(session.user)
              await fetchUserProfile(session.user.id, session.user)
            } else {
              setLoading(false)
            }
          }
        } catch (e) {
          console.error('Fallback session check failed:', e)
          if (active) setLoading(false)
        }
      }
    }, 200)

    return () => {
      active = false
      clearTimeout(fallbackTimer)
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
