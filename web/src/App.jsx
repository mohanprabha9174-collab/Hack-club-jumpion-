import bubbleImg from './assets/text-bubble.png'
import cloudImg from './assets/finish-cloud.jpg'
import titleImg from './assets/jumpion-title.png'
import staryImg from './assets/stary.png'
import { useStaryControls } from './useStaryControls.js'
import { Question } from './Question.jsx'
import './App.css'

const STARY_SIZE = 168
const LAUNCH_PLATFORM = 5
const PLATFORM_POSITIONS = [65, 54, 43, 32, 43, 54, 65, 54, 43, 32, 43, 54, 65, 54, 43, 32, 43, 54, 65, 54, 50]
const RESULT_LABELS = {
  common: 'Common · Double jump unlocked',
  rare: 'One in a Jumpion!',
  timeout: 'Time’s up',
}

function App() {
  const { stageRef, finishIntro, question, result, won } = useStaryControls()

  return (
    <main className="stage" ref={stageRef} style={{ '--platform-count': PLATFORM_POSITIONS.length }}>
      <div className="game-world">
        <div className="wall wall-left" aria-hidden="true" />
        <div className="wall wall-right" aria-hidden="true" />
        {PLATFORM_POSITIONS.map((left, index) => {
          const level = index + 1
          const questionIndex = level % 3 === 0 ? level / 3 - 1 : undefined

          return (
            <div
              key={level}
              className="platform"
              data-question={questionIndex}
              style={{ '--platform-x': `${left}%`, '--platform-level': level }}
              aria-hidden="true"
            >
              {level === LAUNCH_PLATFORM && <div className="launch-pad" />}
            </div>
          )
        })}
        <div className="finish-cloud">
          <img src={cloudImg} alt="Home cloud" />
        </div>
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
      </div>
      <h1 className="title">
        <img src={titleImg} width="249" height="66" alt="Jumpion" />
      </h1>
      {question && <Question deadline={question.deadline} onFinish={question.finish} questionIndex={question.index} />}
      {result && !won && <p className="question-result" role="status">{RESULT_LABELS[result]}</p>}
      {won && (
        <div className="question-overlay">
          <section className="question-box win-box" role="status">
            <h2>You win!</h2>
            <p>Stary made it home.</p>
          </section>
        </div>
      )}
    </main>
  )
}

export default App
