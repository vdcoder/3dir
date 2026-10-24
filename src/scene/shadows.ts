import type * as THREE from 'three'

// The world is static, so shadows are rendered on demand instead of every frame.
let renderer: THREE.WebGLRenderer | null = null
let invalidateFn: (() => void) | null = null

export function initShadows(gl: THREE.WebGLRenderer, invalidate: () => void) {
  renderer = gl
  invalidateFn = invalidate
  gl.shadowMap.autoUpdate = false
  gl.shadowMap.needsUpdate = true
}

/** Ask for the shadow map to be redrawn on the next frame. */
export function refreshShadows() {
  if (!renderer) return
  renderer.shadowMap.needsUpdate = true
  invalidateFn?.()
}
