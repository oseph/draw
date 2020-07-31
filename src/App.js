import React from 'react';
import CanvasController from './CanvasController';
import './App.css';

const version = "0.1"

function App() {
  document.title = `draw (v.${version})`;

  return (
    <div>
    <CanvasController></CanvasController>
    </div>
  );
}

export default App;