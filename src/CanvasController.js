import React from 'react';
import UIPanel from './UIPanel';
import Pressure from 'pressure';

let mouseDown = false;
let mouseDragged = false;
let brushSize = 15;
let pressure  = 0.5;
let mouseLocation = {};

document.body.addEventListener("mousedown", function() { 
  mouseDown = true;
});

document.body.ontouchstart = function() {
  mouseDown = true;
}

document.body.onmouseup = function() {
  mouseDown = false;
}

document.body.ontouchend = function() {
  mouseDown = false;
}

class CanvasController extends React.Component {
  static defaultProps = {
    width: 0.9*window.innerWidth,
    height: 0.7*window.innerHeight,
    brushCol: 'black',
    mouseLoc: {x:0, y:0},
    prevMouseLoc: [0, 0]
  };

  constructor(props) {
    super(props);
    this.state = {
      opacity: 1,
      brushSize: brushSize,
      color: 0,
      pressure: 0.5,
      mouseOut: false,
      mouseDragged: false
    };

    document.title = "draw"

    this.canvasRef = React.createRef();
    this.brushPanelRef = React.createRef();
    this.opacityChange = this.opacityChange.bind(this);
    this.colorChange = this.colorChange.bind(this);
    this.keyDown = this.keyDown.bind(this);

    document.body.onkeydown = this.keyDown;

    this.currentBrushStroke = []; // current line being drawn
    this.strokeHistory = [];      // for the undostack. 
    this.redoStack = [];

    // this is the graphics context we brush strokes onto. gets pushed down main canvas on mouse up
    this.drawLayer = document.createElement('canvas');
    this.drawLayer.width = this.props.width;
    this.drawLayer.height = this.props.height;

    // this is the drawing-to-date. 
    this.drawingToDate = document.createElement('canvas');
    this.drawingToDate.width = this.props.width;
    this.drawingToDate.height = this.props.height;

    this.brushCursor = document.createElement('canvas');
    this.brushCursor.width = brushSize;
    this.brushCursor.height = brushSize;
    this.brushCursor_ctx = this.brushCursor.getContext("2d");
  }

  componentDidMount() {
    this.main_ctx = this.canvasRef.current.getContext('2d');
    this.main_ctx.lineWidth = brushSize;
    this.main_ctx.strokeStyle = "white";
    this.main_ctx.lineJoin = 'round';
    this.main_ctx.lineCap = 'round';
    this.bbox = this.canvasRef.current.getBoundingClientRect();
    this.main_ctx.fillRect(0,0, this.main_ctx.canvas.width, this.main_ctx.canvas.height);

    this.drawingToDate_ctx = this.drawingToDate.getContext('2d');

    this.drawLayer_ctx = this.drawLayer.getContext('2d');
    this.drawLayer_ctx.globalAlpha = this.state.opacity;
    this.drawLayer_ctx.lineCap = 'round';
    this.drawLayer_ctx.lineJoin = 'round';
    this.drawLayer_ctx.fillStyle = "white";
    this.drawLayer_ctx.fillRect(0,0, this.drawLayer.width,this.drawLayer.height);
    this.main_ctx.drawImage(this.drawLayer_ctx.canvas,0,0);

    Pressure.set('#mainCanvas', {
      change: (force, event) => {
        pressure = force
      },
    }, {polyfill: false, });

    this.clearScene();
  }

  endDrawState() {
    this.drawingToDate_ctx.clearRect(0,0,this.drawingToDate.width, this.drawingToDate.width);
    this.drawingToDate_ctx.drawImage(this.main_ctx.canvas, 0,0);
    this.strokeHistory.push(this.currentBrushStroke)
    this.currentBrushStroke = [];
  }

  mouseUp = () => {
    mouseDown = false;
    mouseDragged = false;
    this.endDrawState();
    this.draw();
  }

  getMousePos = (e) => {   
    mouseLocation.x = (e.pageX || e.touches[0].pageX) - this.bbox.left;
    mouseLocation.y = (e.pageY || e.touches[0].pageY) - this.bbox.top
  }

  mouseMove = (e) => {
    this.getMousePos(e);
    if (mouseDown) {
      mouseDragged = true;
      this.addPoint(mouseLocation);
      this.draw(e)
    } else {
      this.main_ctx.clearRect(0,0, this.canvasRef.width, this.canvasRef.height);
      this.main_ctx.drawImage(this.drawingToDate,0,0);
      this.drawCursor(mouseLocation, this.main_ctx);
    }
    this.setState({
      mouseLoc: mouseLocation,      
    });
  }

  mouseDown = (e) => {
    mouseDown = true;
    this.getMousePos(e);
    this.addPoint(mouseLocation);
    this.draw();
    this.setState({
      mouseLoc: mouseLocation,
      mouseOut: false
    });
  }

  addPoint(point) {
    let p = {
      x: point.x,
      y: point.y,
      pressure: pressure,
      color: this.state.color
    }
    this.currentBrushStroke.push(p);
  }

  // draw the scene (e.g. current brush stroke, previou)
  draw = () => {
    this.drawLayer_ctx.clearRect(0,0, this.drawLayer.width, this.drawLayer.height);
    this.drawLayer_ctx.strokeStyle = `rgba(${this.state.color},${this.state.color},${this.state.color}, 1.0)`;

    if (this.currentBrushStroke.length === 1 && !mouseDragged) {
      this.drawLayer_ctx.fillStyle = this.drawLayer_ctx.strokeStyle;
      this.drawLayer_ctx.beginPath();
      let startPos = this.currentBrushStroke[0];
      this.drawLayer_ctx.arc(startPos.x, startPos.y, (brushSize/2)*pressure, 0, 2*Math.PI);
      this.drawLayer_ctx.fill();
      this.drawLayer_ctx.closePath();
    } else if (this.currentBrushStroke.length > 1) {
      this.drawStroke(this.currentBrushStroke, this.drawLayer_ctx);
    }

    for (let i = 1; i < this.strokeHistory.length; ++i) {
      this.drawStroke(this.strokeHistory[i], this.drawLayer_ctx)
    }
    
    this.drawingToDate_ctx.drawImage(this.drawLayer, 0, 0)
    this.main_ctx.fillStyle = "white"
    this.main_ctx.fillRect(0,0, this.main_ctx.canvas.width, this.main_ctx.canvas.height)
    this.main_ctx.drawImage(this.drawLayer, 0, 0);
  }

  drawCursor() {
    if (!mouseDown && !mouseDragged) {
      this.brushCursor.width =  brushSize;
      this.brushCursor.height = brushSize;
      this.brushCursor_ctx = this.brushCursor.getContext("2d");
      this.brushCursor_ctx.lineStyle ="black"

      this.brushCursor_ctx.beginPath();
      this.brushCursor_ctx.arc(this.brushCursor.width/2, this.brushCursor.height/2, brushSize/4, 0, Math.PI*2);
      this.brushCursor_ctx.stroke();

      this.main_ctx.drawImage(this.brushCursor, mouseLocation.x-brushSize/2, mouseLocation.y-brushSize/2);
    }
  }

  drawStroke(points, context) {
    if (points === undefined || points.length < 1) {return}
    let color = points[0].color;
    context.lineStyle = `rgba(${color},${color},${color},1.0)`
    
    for (let i = 1; i < points.length; i++) {
      let presh = (points[i].pressure + points[i-1].pressure)*0.5 * (brushSize);
      let start_pos = points[i-1];
      let end_pos = points[i];
      context.beginPath();
      context.moveTo(start_pos.x, start_pos.y);
      context.lineTo(end_pos.x, end_pos.y);
      context.lineWidth = presh;
      context.lineStyle = "black"
      context.stroke();
      context.closePath();
    }
  }

  downHandler = (ev) => {
    let el = document.getElementById("mainCanvas");
    if (!mouseDown) mouseDown = true;
    // Element "target" will receive/capture further events
    el.setPointerCapture(ev.pointerId);
  }

  cancelHandler = (ev) => {
    let el = document.getElementById("mainCanvas");
    // Release the pointer capture
    mouseDown = false;
    mouseDragged = false;
    el.releasePointerCapture(ev.pointerId);
  }

  brushSizeChange = (e) => {
    this.brushPanelRef.current.setBrushSize(e.target.value);
    brushSize = e.target.value
    this.setState({
      brushSize: brushSize,
    })
  }

  opacityChange = (e) => {
    this.brushPanelRef.current.setOpacity(e.target.value);
    this.setState({
      opacity: e.target.value,
    })
  }

  colorChange = (e) => {
    this.brushPanelRef.current.setBrushColor(e.target.value);
    this.setState({
      color: e.target.value,
    })
  }

  resetDrawing = () => {
    this.currentBrushStroke = [];
    this.strokeHistory = [];
    this.clearScene();
  }

  clearScene = () => {
    let main_ctx = this.canvasRef.current.getContext('2d');
    main_ctx.globalAlpha = 1.0;
    main_ctx.fillStyle = "white";
    main_ctx.fillRect(0,0,this.canvasRef.width, this.canvasRef.height);

    this.drawingToDate_ctx.globalAlpha = 1.0;
    this.drawingToDate_ctx.fillStyle = "white";
    this.drawingToDate_ctx.fillRect(0,0,this.drawingToDate.width, this.drawingToDate.height);

    this.drawLayer_ctx.globalAlpha = 1.0;
    this.drawLayer_ctx.fillStyle = "white";
    this.drawLayer_ctx.fillRect(0,0, this.drawLayer.width, this.drawLayer.height);
  }

  downloadImage = () => {
    var link = document.createElement('a');
    link.download = 'filename.png';
    link.href = document.getElementById('mainCanvas').toDataURL()
    link.click();
  }
  
  undo = () => {
    if (this.strokeHistory.length > 1) {
      this.redoStack.push(this.strokeHistory.pop())
    }
    this.clearScene()
    this.draw()
  }

  redo = () => {
    if (this.redoStack.length > 1) {
      this.strokeHistory.push(this.redoStack.pop())
    }
    
    this.clearScene()
    this.draw()
  }

  keyDown = (event) => {
    event.preventDefault();
    // var brushSize = this.state.brushSize;
    var keydown = (event.key === "[" || event.key === "]");
    switch (event.key) {
      case "]":
        // increase brushSize
        if (brushSize < 5) brushSize += 1;
        else if (brushSize < 10) brushSize += 2;
        else if (brushSize < 50) brushSize += 5;
        
        if (brushSize > 50) brushSize = 50;
        this.draw()
        this.drawCursor()
        break;
      case "[":
        // increase brushSize
        if (brushSize < 5) brushSize -= 1;
        else if (brushSize < 10) brushSize -= 2;
        else if (brushSize <= 50) brushSize -= 5;
        if (brushSize <= 0) brushSize = 1;
        this.draw();
        this.drawCursor();
        break;
      case "z":
        this.undo();
        break;
      case "Z":
        this.redo();
        break;
      default:
        break;
    }

    if (keydown) {
      this.brushPanelRef.current.setBrushSize(brushSize);
      this.setState({
        brushSize: brushSize,
      })
    }
  }

  render() {
    const {
      width,
      height, 
    } = this.props;
    
    const buttonStyle ={
      float: "left",
      height: "3em",
      width: "auto",
      margin:"1em"
    }

    return (
      <div > 
      <canvas
        id = "mainCanvas"
        style={{
          margin: "1.5em",
          cursor: "none",
        }}
        ref={this.canvasRef} 
        width={width} 
        height={height} 

        onPointerDown={this.mouseDown}
        onPointerUp={this.mouseUp}
        onPointerCancel={this.mouseUp}
        onPointerMove={this.mouseMove}
        onLostPointerCapture={this.mouseUp}
        onGotPointerCapture={this.mouseDown}
        
        onPointerOut={(e) => {
          this.draw()
          this.endDrawState();
          mouseDragged = false;
        }}
        
        onMouseEnter={ (e) => {
          if (mouseDown) {
            mouseDragged = true;
            this.setState({
              mouseOut : false,
            });
            this.draw();
          }
        }}
        />

      <UIPanel 
        ref={this.brushPanelRef} 
        onBrushSizeChange={this.brushSizeChange}
        onOpacityChange={this.opacityChange}
        onColorChange={this.colorChange}
        brushSize={this.state.brushSize}
        opacity={this.state.opacity}
        color={this.state.color} />

        <button style={buttonStyle} onClick={this.resetDrawing}>clear</button>
        <button style={buttonStyle} onClick={this.downloadImage}>download</button>
        <button style={buttonStyle} onClick={this.undo}>undo</button>
        <button style={buttonStyle} onClick={this.redo}>redo</button>
      </div>
    );  
  }
}

export default CanvasController;