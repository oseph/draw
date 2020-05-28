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

  update(val) {
    this.setState({
      value: val
    });
  }

  render() {
    return(
      <div className="slider-chunk">
        <div className="slider-label">
          {this.props.name}<span className="slider-label-value">{this.state.value}</span>
        </div>
        <input className="slider" type="range" min={this.state.min} max={this.state.max} value={this.state.value} step={this.state.stepSize} onChange={this.props.onChange}/>
      </div>
    );
  }
}

export default Slider;