'use client'

// Single GSAP entry point — import from here so plugins register exactly once.

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP as useGSAPBase } from '@gsap/react'

if (typeof window !== 'undefined') {
  const originalRemoveChild = Node.prototype.removeChild
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child && child.parentNode !== this) {
      if (child.parentNode) {
        return child.parentNode.removeChild(child) as T
      }
      return child
    }
    return originalRemoveChild.call(this, child) as T
  }

  const originalInsertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (referenceNode.parentNode) {
        return referenceNode.parentNode.insertBefore(newNode, referenceNode) as T
      }
      return this.appendChild(newNode) as T
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T
  }
}

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
