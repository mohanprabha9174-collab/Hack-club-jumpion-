import { useEffect, useRef, useState } from 'react'
import bubbleImg from './assets/text-bubble.png'
import titleImg from './assets/jumpion-title.png'
import staryImg from './assets/stary.png'
import './App.css'

const STARY_SIZE = 168
const STEP = 20
const HOP_HEIGHT = 96
const HOP_TIME = 150

function App() {
  const stageRef = useRef(null)
  const hasLanded = useRef(false)
  const [horizontalOffset, setHorizontalOffset] = useState(0)
  const [isHopping, setIsHopping] = useState(false)

  useEffect(() => {
    const stage = stageRef.current
    const stary = stage.querySelector('.stary')
    const leftWall = stage.querySelector('.wall-left')
    const rightWall = stage.querySelector('.wall-right')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let hopTimer = null

    function moveStary(distance) {
      const middleWidth = rightWall.getBoundingClientRect().left - leftWall.getBoundingClientRect().right
      const edge = Math.max(0, (middleWidth - stary.offsetWidth) / 2)
      setHorizontalOffset(offset => Math.max(-edge, Math.min(edge, offset + distance)))
    }

    function handleResize() {
      moveStary(0)
    }

    function handleKeyDown(event) {
      const { key } = event
      if (key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== 'ArrowUp') return
      if (event.altKey || event.ctrlKey || event.metaKey) return

      event.preventDefault()
      if (event.repeat || (!hasLanded.current && !reducedMotion.matches)) return

      if (key === 'ArrowUp') {
        if (hopTimer !== null) return

        setIsHopping(true)
        hopTimer = window.setTimeout(() => {
          setIsHopping(false)
          hopTimer = null
        }, HOP_TIME)
        return
      }

      moveStary(key === 'ArrowLeft' ? -STEP : STEP)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleResize)
      window.clearTimeout(hopTimer)
    }
  }, [])

  function handleLanding() {
    hasLanded.current = true
  }

  const staryPosition = {
    '--stary-x': `${horizontalOffset}px`,
    '--stary-y': `${isHopping ? -HOP_HEIGHT : 0}px`,
  }

  return (
    <main className="stage" ref={stageRef} style={staryPosition}>
      <div className="wall wall-left" aria-hidden="true" />
      <div className="wall wall-right" aria-hidden="true" />
      <h1 className="title">
        <img src={titleImg} width="249" height="66" alt="Jumpion" />
      </h1>
      <img
        src={staryImg}
        className="stary"
        width={STARY_SIZE}
        height={STARY_SIZE}
        alt="Stary"
        onAnimationEnd={handleLanding}
      />
      <img src={bubbleImg} className="text-bubble" width="674" height="370" alt="" />
      <div className="ground" aria-hidden="true" />
    </main>
  )
}

export default App
