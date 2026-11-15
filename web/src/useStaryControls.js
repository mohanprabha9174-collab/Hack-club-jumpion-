import { useEffect, useRef, useState } from 'react'

const MOVE_STEP = 24
const MOVE_INTERVAL_MS = 65
const JUMP_HEIGHT = 208
const SECONDS_TO_PEAK = 0.25
const GRAVITY = 2 * JUMP_HEIGHT / SECONDS_TO_PEAK ** 2
const JUMP_SPEED = GRAVITY * SECONDS_TO_PEAK
const QUESTION_TIME_MS = 30_000

// Solve the height equation for the time Stary crosses a platform on the way down.
// https://openstax.org/books/physics/pages/3-2-representing-acceleration-with-equations-and-graphs
function platformLandingTime(startHeight, launchSpeed, platformElevation) {
  const riseToPlatform = platformElevation - startHeight
  const speedSquared = launchSpeed ** 2 - 2 * GRAVITY * riseToPlatform
  if (speedSquared < 0) return Infinity

  return (launchSpeed + Math.sqrt(speedSquared)) / GRAVITY
}

export function useStaryControls() {
  const stageRef = useRef(null)
  const introFinished = useRef(false)
  const [question, setQuestion] = useState(null)
  const [result, setResult] = useState(null)

  // https://react.dev/reference/react/useEffect#connecting-to-an-external-system
  useEffect(() => {
    const stage = stageRef.current
    const stary = stage.querySelector('.stary')
    const ground = stage.querySelector('.ground')
    const platforms = [...stage.querySelectorAll('.platform')].reverse()
    const leftWall = stage.querySelector('.wall-left')
    const rightWall = stage.querySelector('.wall-right')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const heldDirections = new Set()
    const visitedPlatforms = new Set()
    let moveTimer = null
    let airFrame = null
    let doubleJumpUnlocked = false
    let airJumpAvailable = true
    let standingPlatform = null
    let pendingQuestion = null
    let xOffset = 0
    let height = 0

    function canMove() {
      return pendingQuestion === null && (introFinished.current || reducedMotion.matches)
    }

    function setHeight(nextHeight) {
      height = nextHeight
      stage.style.setProperty('--stary-y', `${-height}px`)
    }

    function isOverPlatform(platform) {
      const star = stary.getBoundingClientRect()
      const block = platform.getBoundingClientRect()
      return star.right > block.left && star.left < block.right
    }

    function findLanding(startHeight, launchSpeed, previousSeconds, seconds) {
      const groundTop = ground.getBoundingClientRect().top
      // Check the highest platform first if a frame crosses more than one.
      for (const platform of platforms) {
        const elevation = groundTop - platform.getBoundingClientRect().top
        const landingTime = platformLandingTime(startHeight, launchSpeed, elevation)
        if (previousSeconds < landingTime && seconds >= landingTime && isOverPlatform(platform)) {
          return { platform, elevation }
        }
      }
      return null
    }

    function askQuestion(platform) {
      if (visitedPlatforms.has(platform)) return
      visitedPlatforms.add(platform)
      stopMoving()

      const nextQuestion = {
        deadline: Date.now() + QUESTION_TIME_MS,
        finish(outcome) {
          if (pendingQuestion !== nextQuestion) return
          pendingQuestion = null
          setQuestion(null)
          setResult(outcome)

          if (outcome === 'common') {
            doubleJumpUnlocked = true
            startAirMovement(JUMP_SPEED / 2)
          } else if (outcome === 'rare') {
            startAirMovement(JUMP_SPEED * 1.5)
          } else if (standingPlatform && !isOverPlatform(standingPlatform)) {
            startAirMovement(0)
          }
        },
      }
      pendingQuestion = nextQuestion
      setResult(null)
      setQuestion(nextQuestion)
    }

    function startAirMovement(launchSpeed) {
      if (airFrame !== null) window.cancelAnimationFrame(airFrame)
      standingPlatform = null
      const startHeight = height
      let startTime = null
      let previousSeconds = -1

      // Use seconds from the frame timestamp so the jump works at different refresh rates.
      // https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
      function moveThroughAir(time) {
        startTime ??= time
        const seconds = (time - startTime) / 1000
        const nextHeight = startHeight + launchSpeed * seconds - GRAVITY * seconds ** 2 / 2
        const landing = findLanding(startHeight, launchSpeed, previousSeconds, seconds)
        previousSeconds = seconds

        if (landing) {
          setHeight(landing.elevation)
          airFrame = null
          airJumpAvailable = true
          standingPlatform = landing.platform
          askQuestion(landing.platform)
          return
        }

        setHeight(Math.max(0, nextHeight))
        if (seconds > 0 && height === 0) {
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

      if (canMove() && standingPlatform && !isOverPlatform(standingPlatform)) startAirMovement(0)
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

    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key#keyboardevent_sequence
    function handleKeyDown(event) {
      const { key } = event
      if (pendingQuestion) return
      if (key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== 'ArrowUp') return
      if (event.altKey || event.ctrlKey || event.metaKey) return

      event.preventDefault()
      if (event.repeat) return

      if (key === 'ArrowUp') {
        if (!canMove()) return

        if (airFrame === null) {
          startAirMovement(JUMP_SPEED)
        } else if (doubleJumpUnlocked && airJumpAvailable) {
          airJumpAvailable = false
          startAirMovement(JUMP_SPEED)
        }
        return
      }

      heldDirections.add(key)
      moveHeldDirection()
      if (moveTimer === null) moveTimer = window.setInterval(moveHeldDirection, MOVE_INTERVAL_MS)
    }

    function handleKeyUp(event) {
      if (heldDirections.delete(event.key) && heldDirections.size === 0) stopMoving()
    }

    function handleResize() {
      if (standingPlatform) {
        setHeight(ground.getBoundingClientRect().top - standingPlatform.getBoundingClientRect().top)
      }
      moveStary(0)
    }

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
      pendingQuestion = null
      if (airFrame !== null) window.cancelAnimationFrame(airFrame)
      stage.style.removeProperty('--stary-x')
      stage.style.removeProperty('--stary-y')
    }
  }, [])

  function finishIntro() {
    introFinished.current = true
  }

  return { stageRef, finishIntro, question, result }
}
