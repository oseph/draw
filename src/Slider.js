import React from 'react';
import './UI.css';

class Slider extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.value,
      min: this.props.min || 0,
      max: this.props.max || 1,
      stepSize: this.props.stepSize || 0.01,
    }
  }

  render() {
    return(
      <div className="slider-chunk">
        <div className="slider-label">
          {this.props.name}<span className="slider-label-value">{this.props.value}</span>
        </div>
        <input className="slider" type="range" min={this.props.min} max={this.props.max} value={this.props.value} step={this.props.stepSize} onChange={this.props.onChange}/>
      </div>
    );
  }
}

export default Slider;