import React from 'react';
import UIPanel from './UIPanel';
import Pressure from 'pressure';

let mouseDown = false;
let mouseDragged = false;
let brushSize = 15;
let pressure  = 0.5;
let mouse = {};

let mouseMode = "mouse";

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
    this.brushCursor.width = brushSize;
    this.brushCursor.height = brushSize;
    this.brushCursor_ctx = this.brushCursor.getContext("2d");
  }

  componentDidMount() {
    // this.canvasRef.current.addEventListener("mousedown", this.mouseDown);
    // this.canvasRef.current.addEventListener("mouseup", this.mouseUp);
    // this.canvasRef.current.addEventListener("mousemove", this.mouseMove);

    // this.canvasRef.current.addEventListener("pointerdown", this.mouseDown);
    // this.canvasRef.current.addEventListener("pointerup", this.mouseUp);
    // this.canvasRef.current.addEventListener("pointercancel", this.mouseUp);
    // this.canvasRef.current.addEventListener("pointermove", this.mouseMove);
    // this.canvasRef.current.addEventListener("ongotpointercapture", this.mouseDown);
    // this.canvasRef.current.addEventListener("onlostpointercapture", this.mouseUp);

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
        pressure = force
      },
    }, {polyfill: false, });
    this.clearScene();
  }

  endDrawState() {
    this.drawing_ctx.clearRect(0,0,this.drawingToDate.width, this.drawingToDate.width);
    this.drawing_ctx.drawImage(this.main_ctx.canvas, 0,0);
    this.pts = [];
  }

  mouseUp = () => {
    mouseDown = false;
    mouseDragged = false;
    this.endDrawState();
  }

  getMousePos = (e) => {   
    mouse.x = (e.pageX || e.touches[0].pageX) - this.bbox.left;
    mouse.y = (e.pageY || e.touches[0].pageY) - this.bbox.top
    // return {
    //   x: (e.pageX || e.touches[0].pageX) - this.bbox.left,
    //   y: (e.pageY || e.touches[0].pageY) - this.bbox.top
    // }
  }

  mouseMove = (e) => {
    this.getMousePos(e);
    if (mouseDown) {
      mouseDragged = true;
      this.addPointAndCheckDistance(mouse);
      this.draw(e)
    } else {
      this.main_ctx.clearRect(0,0, this.canvasRef.width, this.canvasRef.height);
      this.main_ctx.drawImage(this.drawingToDate,0,0);
      // if (e.pointerType !== "pen") {
        // console.log(e.pointerType)
        this.drawCursor(mouse, this.main_ctx);
      // }
    }
    this.setState({
      mouseLoc: mouse,      
    });
  }

  mouseDown = (e) => {
    if (e.pointerType === "pen") mouseMode = "pen" 
    else mouseMode = "mouse"

    mouseDown = true;
    this.getMousePos(e);
    this.addPointAndCheckDistance(mouse);
    this.draw();
    this.setState({
      mouseLoc: mouse,
      mouseOut: false
    });
  }

  addPointAndCheckDistance(pt) {
    // if (this.pts.length > 0) {
    //   let last_pt = this.pts[this.pts.length-1];
    //   let dist = Math.sqrt( Math.pow((pt.x-last_pt.x), 2) + Math.pow((pt.y-last_pt.y), 2));
    //   if (dist > 5.0) {
    //     let px = (pt.x + last_pt.x) / 2;
    //     let py = (pt.y + last_pt.y) / 2;
    //     let point = {
    //       x: px,
    //       y: py,
    //       pressure: pressure
    //     }
    //     this.pts.push(point);
    //   }
    // }
    let point = {
      x: pt.x,
      y: pt.y,
      pressure: pressure
    }
    this.pts.push(point);
  }

  draw = () => {
    this.drawLayer_ctx.clearRect(0,0, this.drawLayer.width, this.drawLayer.height);
    this.drawLayer_ctx.strokeStyle = `rgba(${this.state.color},${this.state.color},${this.state.color}, 1.0)`;

    if (this.pts.length === 1 && !mouseDragged) {
      this.drawLayer_ctx.fillStyle = this.drawLayer_ctx.strokeStyle;
      this.drawLayer_ctx.beginPath();
      let startPos = this.pts[0];
      this.drawLayer_ctx.arc(startPos.x, startPos.y, (brushSize/2)*pressure, 0, 2*Math.PI);
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

  drawCursor() {
    if (!mouseDown && !mouseDragged) {
      this.brushCursor.width =  brushSize;
      this.brushCursor.height = brushSize;
      this.brushCursor_ctx = this.brushCursor.getContext("2d");
      this.brushCursor_ctx.lineStyle ="black"
      this.brushCursor_ctx.beginPath();
      this.brushCursor_ctx.arc(this.brushCursor.width/2, this.brushCursor.height/2, brushSize/4, 0, Math.PI*2);
      // this.brushCursor_ctx.closePath();
      this.brushCursor_ctx.stroke();
      this.main_ctx.drawImage(this.brushCursor, mouse.x-brushSize/2, mouse.y-brushSize/2);
    }
  }
  
  /** pulled this from http://jsfiddle.net/NWBV4/10/ .. */
  // drawPoints(points, ctx) {}

  drawStroke(points, context) {
    for (let i = 1; i < points.length; i++) {
      let presh;
      if (mouseMode === "pen" && (i === 1 || i === points.length-1)) {
        presh = (points[i].pressure + points[i-1].pressure)*0.6 * (brushSize);
      } else {
        presh = (points[i].pressure + points[i-1].pressure)*0.5 * (brushSize);
      }
      let start_pos = points[i-1];
      let end_pos = points[i];
      context.beginPath();
      context.moveTo(start_pos.x, start_pos.y);
      context.lineTo(end_pos.x, end_pos.y);
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

  clearScene = () => {
    let main_ctx = this.canvasRef.current.getContext('2d');
    main_ctx.globalAlpha = 1.0;
    main_ctx.fillStyle = "white";
    main_ctx.fillRect(0,0,this.canvasRef.width, this.canvasRef.height);
    

    this.drawing_ctx.globalAlpha = 1.0;
    this.drawing_ctx.fillStyle = "white";
    this.drawing_ctx.fillRect(0,0,this.drawingToDate.width, this.drawingToDate.height);

    this.drawLayer_ctx.globalAlpha = 1.0;
    this.drawLayer_ctx.fillStyle = "white";
    this.drawLayer_ctx.fillRect(0,0, this.drawLayer.width, this.drawLayer.height);
    this.draw();
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
    //     this.canvasRef.current.addEventListener("pointerdown", this.mouseDown);
    // this.canvasRef.current.addEventListener("pointerup", this.mouseUp);
    // this.canvasRef.current.addEventListener("pointercancel", this.mouseUp);
    // this.canvasRef.current.addEventListener("pointermove", this.mouseMove);
    // this.canvasRef.current.addEventListener("ongotpointercapture", this.mouseDown);
    // this.canvasRef.current.addEventListener("onlostpointercapture", this.mouseUp);
        onPointerDown={this.mouseDown}
        onPointerUp={this.mouseUp}
        onPointerCancel={this.mouseUp}
        onPointerMove={this.mouseMove}
        onLostPointerCapture={this.mouseUp}
        onGotPointerCapture={this.mouseDown}
        // onMouseDown={this.mouseDown} 
        // onTouchStart={this.mouseDown} 
        // onMouseMove={this.mouseMove} 
        // onTouchMove={this.mouseMove}
        // onMouseUp={this.mouseUp} 
        // onTouchEnd={this.mouseUp}
        
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

        <button style={buttonStyle} onClick={this.clearScene}>clear</button>
        <button style={buttonStyle} onClick={this.downloadImage}>download</button>
      </div>
    );  
  }
}

export default CanvasController;