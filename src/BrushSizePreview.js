import React from 'react';

class BrushSizePreview extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      width: 50.0,
      height: 50.0,
      color: props.color,
      opacity: props.opacity,
      brushSize: props.brushSize
    }
    this.canvasRef = React.createRef();
   }

  componentDidMount() {
    this.redraw();
  }

  redraw() {
    var context = this.canvasRef.current.getContext('2d');
    let scaled_size = this.state.brushSize/50.0;
    context.clearRect(0,0,this.state.width, this.state.height);
    context.fillStyle = "lightgrey";
    context.fillRect(0,0,this.state.width, this.state.height);
    context.fillStyle = "rgba("+this.state.color+","+this.state.color+","+this.state.color+", "+this.state.opacity+")";
    context.beginPath();
    context.arc(this.state.width/2, this.state.height/2, scaled_size*25, 0, 2 * Math.PI);
    context.fill();
    context.closePath();
  }

  setBrushSize(num) {
    this.setState({
      brushSize: num,
    });
    this.redraw();
  }

  setOpacity(num) {
    this.setState({
      opacity: num,
    });
    this.redraw();
  }

  /// set grey, 0-255
  setColor(num) {
    this.setState({
      color: num,
    });
    this.redraw();
  }


  render() {
    return (
      <div>
        <canvas 
          style={{margin: '1em'}}
          ref={this.canvasRef}
          width={this.state.width}
          height={this.state.height}
        />
      </div>
    );
  }
}

export default BrushSizePreview;