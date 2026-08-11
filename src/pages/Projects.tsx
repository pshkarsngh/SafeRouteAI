import Paragraph from '../components/ScrollReveal/Paragraph'
import Word from '../components/ScrollReveal/Word'
import Character from '../components/ScrollReveal/Character'

const paragraph =
  'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.'

export default function Projects() {
  return (
    <main>
      <div style={{ height: '100vh' }} />
      <Paragraph paragraph={paragraph} />
      <div style={{ height: '100vh' }} />
      <Word paragraph={paragraph} />
      <div style={{ height: '100vh' }} />
      <Character paragraph={paragraph} />
      <div style={{ height: '100vh' }} />
    </main>
  )
}
