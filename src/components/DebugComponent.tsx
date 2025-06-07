import { useState, useEffect, useRef } from 'react'

export function DebugComponent() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [clickCount, setClickCount] = useState(0)
  const buttonRef = useRef<HTMLButtonElement>(null)
  
  useEffect(() => {
    console.log('DebugComponent mounted')
    setIsLoaded(true)
    
    // Add direct DOM event listener as backup
    const button = buttonRef.current
    if (button) {
      const handleClick = () => {
        console.log('DOM event listener triggered!')
        alert('DOM Click Works!')
        setClickCount(prev => prev + 1)
      }
      
      button.addEventListener('click', handleClick)
      
      return () => {
        button.removeEventListener('click', handleClick)
      }
    }
    
    return () => {
      console.log('DebugComponent unmounting')
    }
  }, [])

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: 'lightblue', 
      border: '2px solid red',
      position: 'fixed',
      top: '10px',
      right: '10px',
      zIndex: 9999
    }}>
      <h3>Debug Component</h3>
      <p>Loaded: {isLoaded ? 'YES' : 'NO'}</p>
      <p>Time: {new Date().toLocaleTimeString()}</p>
      <p>Clicks: {clickCount}</p>
      
      <button 
        ref={buttonRef}
        onClick={() => {
          console.log('React onClick triggered!')
          alert('React Click Works!')
          setClickCount(prev => prev + 1)
        }}
        onMouseDown={() => console.log('Mouse down')}
        onMouseUp={() => console.log('Mouse up')}
        onMouseOver={() => console.log('Mouse over')}
        style={{ 
          pointerEvents: 'auto',
          cursor: 'pointer',
          padding: '8px',
          backgroundColor: 'green',
          color: 'white',
          border: '2px solid black',
          display: 'block',
          margin: '10px 0'
        }}
      >
        Test Click
      </button>
      
      <div 
        style={{ 
          padding: '10px', 
          backgroundColor: 'yellow',
          cursor: 'pointer',
          border: '1px solid black'
        }}
        onClick={() => {
          console.log('Div clicked!')
          alert('Div works!')
        }}
      >
        Click this div too
      </div>
    </div>
  )
}