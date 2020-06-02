import React from 'react';
import UIPanel from './UIPanel';
import Pressure from 'pressure';

let mouseDown = false;
let brushSize = 15;
let pressure  = 0.5;

document.body.addEventListener("mousedown", function() { 
  mouseDown = true;
} );
// document.body.onmousedown = 
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
    mouseLoc: [0, 0],
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
    };

    document.title = "draw"

    this.canvasRef = React.createRef();
    
    this.brushPanelRef = React.createRef();
    this.opacityChange = this.opacityChange.bind(this);
    this.colorChange = this.colorChange.bind(this);
    this.keyDown = this.keyDown.bind(this);

    document.body.onkeydown = this.keyDown;

    this.pts = []; // current line being drawn
    this.strokeHistory = []; // for the undostack. 

    // this is the graphics context we brush strokes onto. gets pushed down main canvas on mouse up
    this.drawLayer = document.createElement('canvas');
    this.drawLayer.width = this.props.width;
    this.drawLayer.height = this.props.height;

    // this is the drawing-to-date. 
    this.drawingToDate = document.createElement('canvas');
    this.drawingToDate.width = this.props.width;
    this.drawingToDate.height = this.props.height;

    this.brushCursor = document.createElement('canvas');
    this.brushCursor.width = this.state.brushSize;
    this.brushCursor.height = this.state.brushSize;
    this.brushCursor_ctx = this.brushCursor.getContext("2d");
  }

  componentDidMount() {
    // this.canvasRef.current.addEventListener("mousedown", this.mouseDown);
    // this.canvasRef.current.addEventListener("mouseup", this.mouseUp);
    // this.canvasRef.current.addEventListener("mousemove", this.mouseMove);

    this.canvasRef.current.addEventListener("pointerdown", this.mouseDown);
    this.canvasRef.current.addEventListener("pointerup", this.mouseUp);
    this.canvasRef.current.addEventListener("pointercancel", this.mouseUp);
    this.canvasRef.current.addEventListener("pointermove", this.mouseMove);
    this.canvasRef.current.addEventListener("ongotpointercapture", this.mouseDown);
    this.canvasRef.current.addEventListener("onlostpointercapture", this.mouseUp);

    // this.canvasRef.current.onpointerdown = this.downHandler;
    // this.canvasRef.current.onpointercancel = this.cancelHandler;

    this.main_ctx = this.canvasRef.current.getContext('2d');
    this.main_ctx.lineWidth = brushSize;
    this.main_ctx.strokeStyle = "white";
    this.main_ctx.lineJoin = 'round';
    this.main_ctx.lineCap = 'round';
    this.bbox = this.canvasRef.current.getBoundingClientRect();
    this.main_ctx.fillRect(0,0, this.main_ctx.canvas.width, this.main_ctx.canvas.height);

    this.drawing_ctx = this.drawingToDate.getContext('2d');

    this.drawLayer_ctx = this.drawLayer.getContext('2d');
    this.drawLayer_ctx.globalAlpha = this.state.opacity;
    this.drawLayer_ctx.lineCap = 'round';
    this.drawLayer_ctx.lineJoin = 'round';
    this.drawLayer_ctx.fillStyle = "white";
    this.drawLayer_ctx.fillRect(0,0, this.drawLayer.width,this.drawLayer.height);
    this.main_ctx.drawImage(this.drawLayer_ctx.canvas,0,0);

    Pressure.set('#mainCanvas', {
      change: (force, event) => {
        // console.log(event.pointerType)
        pressure = force
        // this.mouseMove(event);
      },
      start: (e) => {
        // mouseDown = true;
        // this.mouseDown(e);
      },
      end: () => {
        // mouseDown = false;
        // pressure = 0.5;
        // this.mouseUp();
      }
    }, {polyfill: false, preventSelect:true});
    this.clearScene();
  }

  endDrawState() {
    this.drawing_ctx.clearRect(0,0,this.drawingToDate.width, this.drawingToDate.width);
    this.drawing_ctx.drawImage(this.main_ctx.canvas, 0,0);
    // this.brushCursor_ctx.clearRect(0,0, this.brushCursor.width, this.brushCursor.height);
    // if (this.strokeHistory.length == 10) {
    //   this.strokeHistory.shift();
    // }
    // this.strokeHistory.push(this.pts);
    this.pts = [];
  }

  mouseUp = () => {
    mouseDown = false;
    // this.brushCursor_ctx.clearRect(0,0, this.brushCursor.width, this.brushCursor.height);
    this.endDrawState();
  }

  getMousePos = (e) => {   
    return [
      (e.pageX || e.touches[0].pageX) - this.bbox.left,
      (e.pageY || e.touches[0].pageY) - this.bbox.top
    ];
  }

  mouseMove = (e) => {
    let mousePos = this.getMousePos(e);
    this.setState({
      mouseLoc: mousePos,
    });
    
    if (mouseDown) {
      let point = {
        pos: mousePos,
        pressure: pressure
      }
      this.pts.push(point);
      this.draw(e)
    } else {
      this.main_ctx.clearRect(0,0, this.canvasRef.width, this.canvasRef.height);
      this.main_ctx.drawImage(this.drawingToDate,0,0);
      if (e.pointerType !== "pen") {
        // console.log(e.pointerType)
        this.drawCursor(mousePos, this.main_ctx);
      }
    }
  }

  mouseDown = (e) => {
    mouseDown = true;
    let mousePos = this.getMousePos(e);
    let point = {
      pos: mousePos,
      pressure: pressure
    }
    this.pts.push(point);
    this.draw(e);
    this.setState({
      mouseLoc: mousePos,
      mouseOut: false
    });
  }

  draw = (e) => {
    this.drawLayer_ctx.clearRect(0,0, this.drawLayer.width, this.drawLayer.height);
    this.drawLayer_ctx.strokeStyle = `rgba(${this.state.color},${this.state.color},${this.state.color}, 1.0)`;

    if (this.pts.length === 1) {
      this.drawLayer_ctx.fillStyle = this.drawLayer_ctx.strokeStyle;
      this.drawLayer_ctx.beginPath();
      let startPos = this.pts[0].pos;
      this.drawLayer_ctx.arc(startPos[0], startPos[1], (this.state.brushSize/2)*pressure, 0, 2*Math.PI);
      this.drawLayer_ctx.fill();
      this.drawLayer_ctx.closePath();

    } else if (this.pts.length > 1) {
      this.drawStroke(this.pts, this.drawLayer_ctx);
    }
    this.main_ctx.globalAlpha = 1.0;
    this.main_ctx.clearRect(0,0, this.canvasRef.width, this.canvasRef.height);
    this.main_ctx.drawImage(this.drawingToDate,0,0);
    this.main_ctx.globalAlpha = this.state.opacity;
    this.main_ctx.drawImage(this.drawLayer,0,0);
  }

  // TODO
  drawStrokeHistory(ctx) {
    for (let i = 0; i < this.strokeHistory.length; i++) {
      this.drawStroke(this.strokeHistory[i], ctx)
    }
  }

  drawCursor(mousePos, ctx) {
    if (!mouseDown) {
      this.brushCursor.width =  this.state.brushSize;
      this.brushCursor.height = this.state.brushSize;
      this.brushCursor_ctx.beginPath();
      this.brushCursor_ctx.arc(this.brushCursor.width/2, this.brushCursor.height/2, this.state.brushSize/4, 0, Math.PI*2);
      // this.brushCursor_ctx.closePath();
      this.brushCursor_ctx.stroke();
      ctx.drawImage(this.brushCursor, mousePos[0]-this.state.brushSize/2, mousePos[1]-this.state.brushSize/2);
    }
  }
  
  /** pulled this from http://jsfiddle.net/NWBV4/10/ .. */
  // drawPoints(points, ctx) {
  //   if (points.length < 6) return;
  //   ctx.beginPath(); 
  //   ctx.moveTo(points[0].pos[0], points[0].pos[1]);
  //   let i = 0;
  //   for (i = 1; i < points.length - 2; i++) {
  //     let c = (points[i].pos[0] + points[i + 1].pos[0]) / 2;
  //     let d = (points[i].pos[1] + points[i + 1].pos[1]) / 2;
  //     ctx.quadraticCurveTo(points[i].pos[0], points[i].pos[1], c, d);
  //   }
  //   ctx.quadraticCurveTo(points[i].pos[0], points[i].pos[1], points[i + 1].pos[0], points[i + 1].pos[1]); 
  //   ctx.stroke();
  //   // ctx.closePath();
  // }

  drawStroke(points, context) {
    for (let i = 1; i < points.length; i++) {
      let start_pos = points[i-1].pos;
      let end_pos = points[i].pos;
      context.beginPath();
      context.moveTo(start_pos[0], start_pos[1]);
      context.lineTo(end_pos[0], end_pos[1]);
      let presh = (points[i].pressure) * (this.state.brushSize);
      context.lineWidth = presh;
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
    el.releasePointerCapture(ev.pointerId);
  }

  brushSizeChange = (e) => {
    this.brushPanelRef.current.setBrushSize(e.target.value);
    this.setState({
      brushSize: e.target.value,
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
    console.log(e.target.value);
  }

  clearScene = () => {

    this.main_ctx.globalAlpha = 1.0;
    this.main_ctx.fillStyle = "white";
    this.main_ctx.fillRect(0,0,this.canvasRef.width, this.canvasRef.height);

    this.drawing_ctx.fillStyle = "white";
    this.drawing_ctx.fillRect(0,0,this.drawingToDate.width, this.drawingToDate.height);

    this.drawLayer_ctx.fillStyle = "white";
    this.drawLayer_ctx.fillRect(0,0, this.drawLayer.width, this.drawLayer.height);
  }

  downloadImage = () => {
    var link = document.createElement('a');
    link.download = 'filename.png';
    link.href = document.getElementById('mainCanvas').toDataURL()
    link.click();
  }


  keyDown = (event) => {
    event.preventDefault();
    // var brushSize = this.state.brushSize;
    var keydown = (event.key === "[" || event.key === "]");
    switch (event.key) {
      case "]":
        // increase brushSize
        console.log("keyDown: increase brushsize.");
        if (brushSize < 5) brushSize += 1;
        else if (brushSize < 10) brushSize += 2;
        else if (brushSize < 50) brushSize += 5;
        
        if (brushSize > 50) brushSize = 50;
        break;
      case "[":
        // increase brushSize
        console.log("keyDown: decrease brushsize.");
        if (brushSize < 5) brushSize -= 1;
        else if (brushSize < 10) brushSize -= 2;
        else if (brushSize <= 50) brushSize -= 5;
        if (brushSize <= 0) brushSize = 1;
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
        // onMouseDown={this.mouseDown} 
        // onTouchStart={this.mouseDown} 
        // onMouseMove={this.mouseMove} 
        // onTouchMove={this.mouseMove}
        // onMouseUp={this.mouseUp} 
        // onTouchEnd={this.mouseUp}
        
        onMouseOut={(e) => {
          this.draw(e)
          this.endDrawState();
        }}
        
        onMouseEnter={ (e) => {
          if (mouseDown) {
            this.setState({
              mouseOut : false,
            });
            this.draw(e);
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

        <button style={buttonStyle} onClick={this.clearScene}>clear</button>
        <button style={buttonStyle} onClick={this.downloadImage}>download</button>
      </div>
    );  
  }
}

export default CanvasController;