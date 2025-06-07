// Minimal App version to isolate the freezing issue

function MinimalApp() {
  console.log('MinimalApp rendering...')
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Minimal Test App</h1>
      <p>If you can see this, React is working</p>
      <button 
        onClick={() => alert('Button clicked!')}
        style={{ 
          padding: '10px', 
          backgroundColor: 'blue', 
          color: 'white',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        Test Button
      </button>
    </div>
  )
}

export default MinimalApp