import bubbleImg from './assets/text-bubble.png'
import titleImg from './assets/jumpion-title.png'
import staryImg from './assets/stary.png'
import './App.css'

function App() {
  return (
    <main className="stage">
      <h1 className="title">
        <img src={titleImg} width="249" height="66" alt="Jumpion" />
      </h1>
      <img src={staryImg} className="stary" width="168" height="168" alt="Stary" />
      <img src={bubbleImg} className="text-bubble" width="674" height="370" alt="" />
    </main>
  )
}

export default App
