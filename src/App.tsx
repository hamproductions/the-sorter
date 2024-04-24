import { useState } from 'react'
import { Text } from './components/ui/text'
import { Container } from 'styled-system/jsx'
import { Button } from './components/ui/button'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Container>
      <Text fontWeight="bold" fontSize="3xl">Hello world</Text>
      <Button onClick={() => setCount(c => c+1)}>{count}</Button>
    </Container>
  )
}

export default App
