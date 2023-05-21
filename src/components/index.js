import React, { useState } from 'react';
import { PlayButton, PauseButton, ForwardButton, ReverseButton,
   ElapsedTimeValue, ElapsedTimeRange } from 'harmoware-vis';
import { PointDataInput } from './PointDataInput';
import { PolygonDataInput } from './PolygonDataInput';

const Checkbox = React.memo(({key,id,onChange,title,className='harmovis_input_checkbox',defaultChecked=false})=>
  <input type="checkbox" key={key} id={id} onChange={onChange} className={className} defaultChecked={defaultChecked} />)

export default class Controller extends React.Component {
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

  setClusterNum(e){
    const { setClusterNum } = this.props;
    setClusterNum(+e.target.value)
  }

  setTextSiza(e){
    const { setTextSiza } = this.props;
    setTextSiza(+e.target.value)
  }

  setPointSiza(e){
    const { setPointSiza } = this.props;
    setPointSiza(+e.target.value)
  }

  setPolypoiMove(e){
    const { setPolypoiMove } = this.props;
    setPolypoiMove(+e.target.value)
  }

  setClusterList(arg){
    console.log({arg})
    const { idx } = arg;
    const { clusterList, setClusterList } = this.props;
    clusterList[idx].check = !clusterList[idx].check
    setClusterList(clusterList)
  }

  onClickAlign(){
    const clickAndMove = document.getElementsByClassName('click-and-move')
    let maxwidth = 0
    let maxheight = 0
    for(const elements of clickAndMove){
      maxwidth = Math.max(elements.width,maxwidth)
      maxheight = Math.max(elements.height,maxheight)
    }
    const count_x_max = ((window.innerWidth-240) / maxwidth)|0
    const count_y_max = (window.innerHeight / maxheight)|0
    let count_x = 0
    let count_y = 0
    for(let i=0; i<clickAndMove.length; i=i+1){
      clickAndMove[i].style.top = `${count_y*maxheight}px`
      clickAndMove[i].style.left = `${count_x*maxwidth}px`
      count_x = count_x + 1
      if(count_x >= count_x_max){
        count_x = 0
        count_y = count_y + 1
        if(count_y >= count_y_max){
          count_y = 0
        }
      }
    }
  }

  render() {

    const { actions, inputFileName, animatePause, animateReverse, leading,
      settime, timeBegin, timeLength, clusterNum, textSiza, pointSiza, clusterList,
      pointData, setPointData, polygonData, setPolygonData, polygonDic, setPolygonDic, polypoiMove } = this.props;
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
            {/* <li className="flex_row">
            <label htmlFor="setPolypoiMove">{`Animation :`}</label>
              <input type="range" value={polypoiMove} min={0} max={200} step={1} onChange={this.setPolypoiMove.bind(this)}
                className='harmovis_input_range' id='setPolypoiMove' title={polypoiMove}/>
            </li> */}
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
            <li className="flex_row">
            <label htmlFor="setPointSiza">{`Point Size : `}</label>
              <input type="range" value={pointSiza} min={0} max={8} step={0.1} onChange={this.setPointSiza.bind(this)}
                className='harmovis_input_range' id='setPointSiza' title={pointSiza}/>
            </li>
            <li className="flex_row">
            <label htmlFor="setTextSiza">{`Text Size : `}</label>
              <input type="range" value={textSiza} min={0} max={20} step={0.2} onChange={this.setTextSiza.bind(this)}
                className='harmovis_input_range' id='setTextSiza' title={textSiza}/>
            </li>
            {clusterList.map((el,idx)=>{
              return (
                <li className="flex_row" key={idx}>
                  <input type="checkbox" id={`ClusterID:${el.cluster}`} onChange={this.setClusterList.bind(this,{idx:idx})} className="harmovis_input_checkbox" defaultChecked={true} />
                  <label htmlFor={`ClusterID:${el.cluster}`}>{`ClusterID : ${el.cluster}`}</label>
                </li>
              )
            })}
            </ul>
        </div>
    );
  }
}
