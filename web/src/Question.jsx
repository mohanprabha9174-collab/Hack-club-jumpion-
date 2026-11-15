import { useEffect, useState } from 'react'
import { krillionQuestions } from './krillionQuestions.js'

function secondsRemaining(deadline) {
  return Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
}

function normalize(answer) {
  return answer
    .normalize('NFKD')
    .toLowerCase()
    .replace(/\p{M}|['’]/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

function scoreAnswer(question, answer) {
  const normalized = normalize(answer)
  if (!normalized) return null
  if (question.rare.some(pick => normalize(pick) === normalized)) return 'rare'
  if (question.common.some(pick => normalize(pick) === normalized)) return 'common'
  return null
}

export function Question({ questionIndex = 0, deadline, onFinish }) {
  const question = krillionQuestions[questionIndex]
  const [seconds, setSeconds] = useState(() => secondsRemaining(deadline))
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    const clock = window.setInterval(() => setSeconds(secondsRemaining(deadline)), 250)
    const timeout = window.setTimeout(() => onFinish('timeout'), Math.max(0, deadline - Date.now()))
    return () => {
      window.clearInterval(clock)
      window.clearTimeout(timeout)
    }
  }, [deadline, onFinish])

  // https://react.dev/reference/react-dom/components/input#reading-the-input-values-when-submitting-a-form
  function submitAnswer(event) {
    event.preventDefault()
    if (Date.now() >= deadline) {
      onFinish('timeout')
      return
    }

    const answer = new FormData(event.currentTarget).get('answer')
    const score = scoreAnswer(question, answer)
    if (score) {
      onFinish(score)
    } else {
      setFeedback('That answer isn’t in the quiz’s sample. Try another.')
    }
  }

  return (
    <div className="question-overlay">
      <form className="question-box" role="dialog" aria-modal="true" aria-labelledby="question-prompt" onSubmit={submitAnswer}>
        <h2 id="question-prompt">{question.prompt}</h2>
        <p>{seconds} seconds left</p>
        <label htmlFor="answer">Your answer</label>
        <input id="answer" name="answer" type="text" autoComplete="off" autoFocus required />
        <button type="submit">Submit</button>
        {feedback && <p role="alert">{feedback}</p>}
        <small>
          Sampled trivia adapted from <a href="https://github.com/StruggleYang/krillion-dataset" target="_blank" rel="noreferrer">KrillionHQ</a>{' '}
          (<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>).
        </small>
      </form>
    </div>
  )
}
