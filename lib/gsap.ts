'use client'

// Single GSAP entry point — import from here so plugins register exactly once.

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP as useGSAPBase } from '@gsap/react'

let pluginsRegistered = false
const registerPlugins = () => {
  if (typeof window === 'undefined' || pluginsRegistered) return
  pluginsRegistered = true
  try {
    gsap.registerPlugin(ScrollTrigger, useGSAPBase)
  } catch (error) {
    console.warn('[gsap] ScrollTrigger unavailable; scroll effects disabled.', error)
  }
}

// Animation setup runs during hydration, so an uncaught throw in any useGSAP
// callback blanks the entire page. Animations are progressive enhancement:
// contain the failure and leave the section static rather than losing the page.
const useGSAP: typeof useGSAPBase = (func, dependencies) =>
  useGSAPBase(
    typeof func === 'function'
      ? (...args: Parameters<typeof func>) => {
          registerPlugins()
          try {
            return func(...args)
          } catch (error) {
            console.warn('[gsap] animation setup failed; section left static.', error)
          }
        }
      : func,
    dependencies
  )

export { gsap, ScrollTrigger, useGSAP }
