import bubbleImg from './assets/text-bubble.png'
import titleImg from './assets/jumpion-title.png'
import staryImg from './assets/stary.png'
import { useStaryControls } from './useStaryControls.js'
import { Question } from './Question.jsx'
import './App.css'

const STARY_SIZE = 168
const PLATFORM_POSITIONS = [65, 54, 43, 32]
const RESULT_LABELS = {
  common: 'Common · Double jump unlocked',
  rare: 'One in a Jumpion!',
  timeout: 'Time’s up',
}

function App() {
  const { stageRef, finishIntro, question, result } = useStaryControls()

  return (
    <main className="stage" ref={stageRef}>
      <div className="wall wall-left" aria-hidden="true" />
      <div className="wall wall-right" aria-hidden="true" />
      {PLATFORM_POSITIONS.map((left, index) => (
        <div
          key={left}
          className="platform"
          style={{ '--platform-x': `${left}%`, '--platform-level': index + 1 }}
          aria-hidden="true"
        />
      ))}
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
      {question && <Question deadline={question.deadline} onFinish={question.finish} />}
      {result && <p className="question-result" role="status">{RESULT_LABELS[result]}</p>}
    </main>
  )
}

export default App
