import { useEffect, useRef } from 'react'

const MOVE_STEP = 24
const MOVE_INTERVAL_MS = 65
const JUMP_HEIGHT = 208
const SECONDS_TO_PEAK = 0.25
const GRAVITY = 2 * JUMP_HEIGHT / SECONDS_TO_PEAK ** 2
const JUMP_SPEED = GRAVITY * SECONDS_TO_PEAK

// Solve the height equation for the time Stary crosses the platform on the way down.
// https://openstax.org/books/physics/pages/3-2-representing-acceleration-with-equations-and-graphs
function platformLandingTime(startHeight, launchSpeed, platformElevation) {
  const riseToPlatform = platformElevation - startHeight
  const speedSquared = launchSpeed ** 2 - 2 * GRAVITY * riseToPlatform
  if (speedSquared < 0) return Infinity

  return (launchSpeed + Math.sqrt(speedSquared)) / GRAVITY
}

export function useStaryControls(platformElevation) {
  const stageRef = useRef(null)
  const introFinished = useRef(false)

  // Set up the browser controls and remove them when the stage goes away.
  // https://react.dev/reference/react/useEffect#connecting-to-an-external-system
  useEffect(() => {
    const stage = stageRef.current
    const stary = stage.querySelector('.stary')
    const platform = stage.querySelector('.platform')
    const leftWall = stage.querySelector('.wall-left')
    const rightWall = stage.querySelector('.wall-right')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const heldDirections = new Set()
    let moveTimer = null
    let airFrame = null
    let airJumpAvailable = true
    let xOffset = 0
    let height = 0

    function canMove() {
      return introFinished.current || reducedMotion.matches
    }

    function isOverPlatform() {
      const star = stary.getBoundingClientRect()
      const block = platform.getBoundingClientRect()
      return star.right > block.left && star.left < block.right
    }

    function startAirMovement(launchSpeed) {
      // A midair jump starts a new arc from Stary's current height.
      if (airFrame !== null) window.cancelAnimationFrame(airFrame)

      const startHeight = height
      const landingTime = platformLandingTime(startHeight, launchSpeed, platformElevation)
      let startTime = null
      let previousSeconds = -1

      // Frame timestamps keep the jump timed by seconds across display refresh rates.
      // https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
      function moveThroughAir(time) {
        startTime ??= time
        const seconds = (time - startTime) / 1000
        const nextHeight = startHeight + launchSpeed * seconds - GRAVITY * seconds ** 2 / 2
        const crossedPlatform = previousSeconds < landingTime && seconds >= landingTime
        const landedOnPlatform = crossedPlatform && isOverPlatform()
        previousSeconds = seconds

        height = landedOnPlatform ? platformElevation : Math.max(0, nextHeight)
        stage.style.setProperty('--stary-y', `${-height}px`)

        const landedOnGround = seconds > 0 && height === 0
        if (landedOnPlatform || landedOnGround) {
          airFrame = null
          airJumpAvailable = true
        } else {
          airFrame = window.requestAnimationFrame(moveThroughAir)
        }
      }

      airFrame = window.requestAnimationFrame(moveThroughAir)
    }

    function moveStary(distance) {
      const spaceBetweenWalls = rightWall.getBoundingClientRect().left - leftWall.getBoundingClientRect().right
      const edge = Math.max(0, (spaceBetweenWalls - stary.offsetWidth) / 2)
      xOffset = Math.max(-edge, Math.min(edge, xOffset + distance))
      stage.style.setProperty('--stary-x', `${xOffset}px`)

      // Walking off the platform starts a fall with no upward speed.
      if (height > 0 && airFrame === null && !isOverPlatform()) startAirMovement(0)
    }

    function moveHeldDirection() {
      if (!canMove()) return

      const left = heldDirections.has('ArrowLeft')
      const right = heldDirections.has('ArrowRight')
      if (left === right) return

      moveStary(right ? MOVE_STEP : -MOVE_STEP)
    }

    function stopMoving() {
      heldDirections.clear()
      window.clearInterval(moveTimer)
      moveTimer = null
    }

    // Keydown starts a direction and keyup releases it. The timer keeps walking during a jump.
    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key#keyboardevent_sequence
    function handleKeyDown(event) {
      const { key } = event
      if (key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== 'ArrowUp') return
      if (event.altKey || event.ctrlKey || event.metaKey) return

      event.preventDefault()
      if (event.repeat) return

      if (key === 'ArrowUp') {
        if (!canMove()) return

        if (airFrame === null) {
          startAirMovement(JUMP_SPEED)
        } else if (airJumpAvailable) {
          airJumpAvailable = false
          startAirMovement(JUMP_SPEED)
        }
        return
      }

      heldDirections.add(key)
      moveHeldDirection()
      if (moveTimer === null) {
        moveTimer = window.setInterval(moveHeldDirection, MOVE_INTERVAL_MS)
      }
    }

    function handleKeyUp(event) {
      if (heldDirections.delete(event.key) && heldDirections.size === 0) stopMoving()
    }

    const handleResize = () => moveStary(0)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', stopMoving)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', stopMoving)
      window.removeEventListener('resize', handleResize)
      stopMoving()
      if (airFrame !== null) window.cancelAnimationFrame(airFrame)
      stage.style.removeProperty('--stary-x')
      stage.style.removeProperty('--stary-y')
    }
  }, [platformElevation])

  function finishIntro() {
    introFinished.current = true
  }

  return { stageRef, finishIntro }
}
