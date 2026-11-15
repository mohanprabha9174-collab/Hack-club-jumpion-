import bubbleImg from './assets/text-bubble.png'
import titleImg from './assets/jumpion-title.png'
import staryImg from './assets/stary.png'
import { useStaryControls } from './useStaryControls.js'
import './App.css'

const STARY_SIZE = 168
const PLATFORM_ELEVATION = 128

function App() {
  const { stageRef, finishIntro } = useStaryControls(PLATFORM_ELEVATION)

  return (
    <main className="stage" ref={stageRef}>
      <div className="wall wall-left" aria-hidden="true" />
      <div className="wall wall-right" aria-hidden="true" />
      <div
        className="platform"
        style={{ '--platform-elevation': `${PLATFORM_ELEVATION}px` }}
        aria-hidden="true"
      />
      <h1 className="title">
        <img src={titleImg} width="249" height="66" alt="Jumpion" />
      </h1>
      <img
        src={staryImg}
        className="stary"
        width={STARY_SIZE}
        height={STARY_SIZE}
        alt="Stary"
        onAnimationEnd={finishIntro}
      />
      <img src={bubbleImg} className="text-bubble" width="674" height="370" alt="" />
      <div className="ground" aria-hidden="true" />
    </main>
  )
}

export default App
