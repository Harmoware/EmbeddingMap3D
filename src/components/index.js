import React, { useState } from 'react';
import { PlayButton, PauseButton, ForwardButton, ReverseButton,
   ElapsedTimeValue, ElapsedTimeRange } from 'harmoware-vis';
import { PointDataInput } from './PointDataInput';
import { PolygonDataInput } from './PolygonDataInput';

const arrStrConv = (value)=>Array.isArray(value)?`[${value.map(el=>arrStrConv(el))}]`:value.toString()

export default class Controller extends React.Component {
  constructor(props){
    super(props)
    this.dimensionList = [...Array(this.props.dimensionNo)].map((_, i) => i)
  }

  componentDidUpdate(prevProps) {
    if(prevProps.dimensionNo !== this.props.dimensionNo){
      this.dimensionList = [...Array(this.props.dimensionNo)].map((_, i) => i)
    }
  }

  onClick(buttonType){
    const { viewState, updateViewState } = this.props;
    switch (buttonType) {
      case 'zoom-in': {
        updateViewState({...viewState, zoom:(viewState.zoom+0.25), transitionDuration: 100,})
        break
      }
      case 'zoom-out': {
        updateViewState({...viewState, zoom:(viewState.zoom-0.25), transitionDuration: 100,})
        break
      }
      case 'reset': {
        updateViewState({
          target: [0, 0, 0],
          rotationX: 5,
          rotationOrbit: -5,
          zoom: 3,
          transitionDuration: 200,
        })
        break
      }
    }
  }

  setTextSiza(e){
    const { setTextSiza } = this.props;
    setTextSiza(+e.target.value)
  }

  setPointSiza(e){
    const { setPointSiza } = this.props;
    setPointSiza(+e.target.value)
  }

  setDimensionX(e){
    const { setDimensionX } = this.props;
    setDimensionX(+e.target.value)
  }

  setDimensionY(e){
    const { setDimensionY } = this.props;
    setDimensionY(+e.target.value)
  }

  setDimensionZ(e){
    const { setDimensionZ } = this.props;
    setDimensionZ(+e.target.value)
  }

  setClusterList(arg){
    console.log({arg})
    const { idx } = arg;
    const { clusterList, setClusterList } = this.props;
    clusterList[idx].check = !clusterList[idx].check
    setClusterList(clusterList)
  }

  render() {

    const { actions, inputFileName, animatePause, animateReverse, leading,
      settime, timeBegin, timeLength, textSiza, pointSiza, clusterList, dimensionX, dimensionY, dimensionZ,
      pointData, setPointData, polygonData, setPolygonData, polygonDic, setPolygonDic } = this.props;
    const { PointFileName, PolygonFileName } = inputFileName;

    return (
        <div className="harmovis_controller">
            <ul className="flex_list">
            <li className="flex_row">
                <div className="harmovis_input_button_column" title='3D object data selection'>
                <label htmlFor="PointDataInput">
                Point data selection<PointDataInput actions={actions} id="PointDataInput"
                pointData={pointData} setPointData={setPointData}
                polygonData={polygonData} setPolygonData={setPolygonData}
                polygonDic={polygonDic} setPolygonDic={setPolygonDic}/>
                </label>
                <div>{PointFileName}</div>
                </div>
            </li>
            <li className="flex_row">
                <div className="harmovis_input_button_column" title='3D object data selection'>
                <label htmlFor="PolygonDataInput">
                Polygon data selection<PolygonDataInput actions={actions} id="PolygonDataInput"
                pointData={pointData} setPointData={setPointData}
                polygonData={polygonData} setPolygonData={setPolygonData}
                polygonDic={polygonDic} setPolygonDic={setPolygonDic}/>
                </label>
                <div>{PolygonFileName}</div>
                </div>
            </li>
            <li className="flex_row">
              {animatePause ?
                <PlayButton actions={actions} />:<PauseButton actions={actions} />
              }&nbsp;
              {animateReverse ?
                <ForwardButton actions={actions} />:<ReverseButton actions={actions} />
              }
            </li>
            <li className="flex_row">
              <button onClick={this.onClick.bind(this,'zoom-in')} className='harmovis_button'>＋</button>
              <button onClick={this.onClick.bind(this,'zoom-out')} className='harmovis_button'>－</button>
            </li>
            <li className="flex_row">
              <label htmlFor="ElapsedTimeValue">elapsedTime</label>
              <ElapsedTimeValue settime={settime} timeBegin={timeBegin} timeLength={timeLength} actions={actions}
              min={leading*-1} id="ElapsedTimeValue" />
            </li>
            <li className="flex_row">
              <ElapsedTimeRange settime={settime} timeLength={timeLength} timeBegin={timeBegin} actions={actions}
              min={leading*-1} style={{'width':'100%'}} />
            </li>
            <li className="flex_column">
            <label htmlFor="setPointSiza" className="range">{`Point Size`}</label>
              <input type="range" value={pointSiza} min={0} max={8} step={0.1} onChange={this.setPointSiza.bind(this)}
                className='harmovis_input_range' id='setPointSiza' title={pointSiza}/>
            </li>
            <li className="flex_column">
            <label htmlFor="setTextSiza" className="range">{`Text Size`}</label>
              <input type="range" value={textSiza} min={0} max={20} step={0.2} onChange={this.setTextSiza.bind(this)}
                className='harmovis_input_range' id='setTextSiza' title={textSiza}/>
            </li>
            {this.dimensionList.length > 1 ? <>
            <label>Dimension select</label>
            <li className="flex_row">
              X:<select id="dimension_select_x" value={dimensionX} onChange={this.setDimensionX.bind(this)}>
                {this.dimensionList.map((data,idx) => <option value={idx} key={idx}>{data}</option>)}
              </select>
              Y:<select id="dimension_select_y" value={dimensionY} onChange={this.setDimensionY.bind(this)}>
                {this.dimensionList.map((data,idx) => <option value={idx} key={idx}>{data}</option>)}
              </select>
              Z:<select id="dimension_select_z" value={dimensionZ} onChange={this.setDimensionZ.bind(this)}>
                {this.dimensionList.map((data,idx) => <option value={idx} key={idx}>{data}</option>)}
              </select>
            </li>
            </> : null}
            {clusterList.map((el,idx)=>{
              return (
                <li className="flex_row" key={idx}>
                  <input type="checkbox" id={`ClusterID:${el.cluster}`} onChange={this.setClusterList.bind(this,{idx:idx})} className="harmovis_input_checkbox" checked={clusterList[idx].check} />
                  <label htmlFor={`ClusterID:${el.cluster}`}>{`ClusterID : ${el.cluster}`}</label>
                </li>
              )
            })}
            </ul>
        </div>
    );
  }
}
