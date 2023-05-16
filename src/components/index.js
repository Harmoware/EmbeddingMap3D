import React, { useState } from 'react';
import { PlayButton, PauseButton, ForwardButton, ReverseButton,
   ElapsedTimeValue, ElapsedTimeRange } from 'harmoware-vis';
import { PointDataInput } from './PointDataInput';
import { PolygonDataInput } from './PolygonDataInput';

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
      settime, timeBegin, timeLength, clusterNum, textSiza, pointSiza,
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
            <li className="flex_row">
            <label htmlFor="setPolypoiMove">{`Animation :`}</label>
              <input type="range" value={polypoiMove} min={0} max={100} step={1} onChange={this.setPolypoiMove.bind(this)}
                className='harmovis_input_range' id='setPolypoiMove' title={polypoiMove}/>
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
            <li className="flex_row">
            <label htmlFor="setPointSiza">{`Point Size : `}</label>
              <input type="range" value={pointSiza} min={0} max={8} step={0.1} onChange={this.setPointSiza.bind(this)}
                className='harmovis_input_range' id='setPointSiza' title={pointSiza}/>
            </li>
            </ul>
            <TransformController/>
        </div>
    );
  }
}
const TransformController = (props)=>{
  let style = {top:'',left:''}
  let transform = ''
  const [rotate,setRotate] = useState(0)
  const [scaleX,setScaleX] = useState(1)
  const [scaleY,setScaleY] = useState(1)
  const [top,setTop] = useState(0)
  const [left,setLeft] = useState(0)
  const select = document.getElementsByClassName('select')[0]
  if(select){
    style = select.style
    transform = select.style.transform
  }

  React.useEffect(()=>{
    if(style.top.includes('px')){
      const value = parseFloat(style.top.match(/-{0,1}[0-9.]+/g)[0])
      setTop(value|0)
    }else{
      setTop(0)
    }
  },[style.top])

  React.useEffect(()=>{
    if(style.left.includes('px')){
      const value = parseFloat(style.left.match(/-{0,1}[0-9.]+/g)[0])
      setLeft(value|0)
    }else{
      setLeft(0)
    }
  },[style.left])

  React.useEffect(()=>{
    if(transform.includes('rotate')){
      const rotate = transform.match(/rotate\(-{0,1}[0-9.]+deg\)/g)[0]
      const value = parseFloat(rotate.match(/-{0,1}[0-9.]+/g)[0])
      setRotate(value|0)
    }else{
      setRotate(0)
    }
    if(transform.includes('scaleX')){
      const scaleX = transform.match(/scaleX\(-{0,1}[0-9.]+\)/g)[0]
      const value = parseFloat(scaleX.match(/-{0,1}[0-9.]+/g)[0])
      setScaleX(value)
    }else{
      setScaleX(1)
    }
    if(transform.includes('scaleY')){
      const scaleY = transform.match(/scaleY\(-{0,1}[0-9.]+\)/g)[0]
      const value = parseFloat(scaleY.match(/-{0,1}[0-9.]+/g)[0])
      setScaleY(value)
    }else{
      setScaleY(1)
    }
  },[transform])

  const onChangeRotate = (e)=>{
    const value = +e.target.value;
    setRotate(value)
    select.style.transform = `rotate(${value}deg) scaleX(${scaleX})  scaleY(${scaleY})`
  }

  const onChangeScaleX = (e)=>{
    const value = +e.target.value;
    setScaleX(value)
    select.style.transform = `rotate(${rotate}deg) scaleX(${value})  scaleY(${scaleY})`
  }

  const onChangeScaleY = (e)=>{
    const value = +e.target.value;
    setScaleY(value)
    select.style.transform = `rotate(${rotate}deg) scaleX(${scaleX})  scaleY(${value})`
  }

  const onChangeTop = (e)=>{
    const value = +e.target.value;
    setTop(value)
    select.style.top = `${value}px`
  }

  const onChangeLeft = (e)=>{
    const value = +e.target.value;
    setLeft(value)
    select.style.left = `${value}px`
  }

  const onClick = ()=>{
    const select = document.getElementsByClassName('select')
    for(const e of select){
      e.classList.remove('select')
    }
  }

  return (<>{select === undefined ? null:
    <ul className="flex_list">
      <li className="flex_row">Image Item Control</li>
      <li className="flex_row">{`${select.title}`}</li>
      <li className="flex_row">
        <label htmlFor="top">{`top :`}</label>
        <input type="range" value={top|0}
          min={0} max={window.innerHeight} step={1} onChange={onChangeTop}
          className="harmovis_input_range" id="top" />
        {`: ${top|0}px`}
      </li>
      <li className="flex_row">
        <label htmlFor="left">{`left :`}</label>
        <input type="range" value={left|0}
          min={0} max={window.innerWidth} step={1} onChange={onChangeLeft}
          className="harmovis_input_range" id="left" />
        {`: ${left|0}px`}
      </li>
      <li className="flex_row">
        <label htmlFor="rotate">{`rotate :`}</label>
        <input type="range" value={rotate|0}
          min={-180} max={180} step={1} onChange={onChangeRotate}
          className="harmovis_input_range" id="rotate" />
        {`: ${rotate|0} °`}
      </li>
      <li className="flex_row">
        <label htmlFor="scaleX">{`scaleX :`}</label>
        <input type="range" value={scaleX}
          min={0} max={2} step={1/select.width} onChange={onChangeScaleX}
          className="harmovis_input_range" id="scaleX" />
        {`: ${Math.round(scaleX*select.width)}px`}
      </li>
      <li className="flex_row">
        <label htmlFor="scaleY">{`scaleY :`}</label>
        <input type="range" value={scaleY}
          min={0} max={2} step={1/select.height} onChange={onChangeScaleY}
          className="harmovis_input_range" id="scaleY" />
        {`: ${Math.round(scaleY*select.height)}px`}
      </li>
      <li className="flex_row">
        <button onClick={onClick} className='harmovis_button'>release</button>
      </li>
    </ul>
    }</>
  )
}