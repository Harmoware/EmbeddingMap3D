import React, { useState } from 'react';
import DeckGL from '@deck.gl/react';
import { PointCloudLayer, LineLayer, COORDINATE_SYSTEM, TextLayer, OrbitView, PolygonLayer } from 'deck.gl';
import {
  Container, connectToHarmowareVis, LoadingIcon, FpsDisplay
} from 'harmoware-vis';
import Controller from '../components';

const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN; //Acquire Mapbox accesstoken

const INITIAL_VIEW_STATE = {
  target: [0, 0, 0],
  rotationX: 5,
  rotationOrbit: -5,
  zoom: 8.5
};

const App = (props)=>{
  const [state,setState] = useState({ popup: [0, 0, ''] })
  const [viewState, updateViewState] = useState(INITIAL_VIEW_STATE);
  const [textSiza, setTextSiza] = useState(10);
  const [pointSiza, setPointSiza] = useState(1);
  const [selectPointId, setSelectPointId] = useState([]);
  const [pointData, setPointData] = useState(null);
  const [polygonData, setPolygonData] = useState(null);
  const [polygonDic, setPolygonDic] = useState(null);
  const [polypoiMove, setPolypoiMove] = useState(0);
  const [polypoiData, setPolypoiData] = useState([]);
  const [clusterList, setClusterList] = useState([]);
  const { actions, viewport, movedData, loading, loopEndPause, timeBegin } = props;

  const positionData = movedData.filter(x=>x.position && x.polygon)

  const autoRotation = async (argRotationOrbit,direction)=>{
    const rotationOrbit = argRotationOrbit+direction
    const transitionDuration = ((55*1000)/360)*Math.abs(direction)
    updateViewState({...viewState, rotationOrbit, transitionDuration})
    if(App.autoRotationId){clearTimeout(App.autoRotationId)}
    App.autoRotationId = setTimeout(autoRotation,transitionDuration,rotationOrbit,direction)
  }

  const autoPolypoiMove = async (argPolypoiMove,direction)=>{
    const polypoiMove = argPolypoiMove + direction
    if(polypoiMove < 0 || polypoiMove > 200){
      if(App.autoPolypoiMoveId){
        clearTimeout(App.autoPolypoiMoveId)
        App.autoPolypoiMoveId = null
      }
      return
    }
    const duration = 10
    setPolypoiMove(polypoiMove)
    if(App.autoPolypoiMoveId){clearTimeout(App.autoPolypoiMoveId)}
    App.autoPolypoiMoveId = setTimeout(autoPolypoiMove,duration,polypoiMove,direction)
  }

  document.onkeydown = (event)=>{
    const tagName = event.target.tagName
    console.log(`tagName:${tagName}`)
    if(tagName !== "INPUT" && tagName !== "SELECT"){
      const keyName = event.key
      console.log(`keypress:${keyName}`)
      if(keyName === "8"){
        document.getElementById('deckgl-wrapper').focus()
        if(App.autoRotationId){
          clearTimeout(App.autoRotationId);
          App.autoRotationId = null
        }
      }
      if(keyName === "7"){
        autoRotation(viewState.rotationOrbit,-1)
      }
      if(keyName === "9"){
        autoRotation(viewState.rotationOrbit,1)
      }
      if(keyName === "4"){
        autoPolypoiMove(polypoiMove,-20)
      }
      if(keyName === "6"){
        autoPolypoiMove(polypoiMove,20)
      }
      if(keyName === "/"){
        actions.setAnimateReverse(!props.animateReverse)
      }
      if(keyName === "2"){
        actions.setAnimatePause(!props.animatePause)
      }
      if(keyName === "1" && props.animatePause === true){
        actions.setTime(props.settime-1)
      }
      if(keyName === "3" && props.animatePause === true){
        actions.setTime(props.settime+1)
      }
      if(keyName === "+"){
        const value = event.shiftKey?0.25:0.5
        updateViewState({...viewState, zoom:(viewState.zoom+value), transitionDuration: 100,})
      }
      if(keyName === "-"){
        const value = event.shiftKey?0.25:0.5
        updateViewState({...viewState, zoom:(viewState.zoom-value), transitionDuration: 100,})
      }
      if(keyName === "*"){
        updateViewState(INITIAL_VIEW_STATE)
      }
    }
  }

  React.useEffect(()=>{
    actions.setNoLoop(true)
    actions.setInitialViewChange(false);
    actions.setSecPerHour(3600);
    actions.setLeading(0);
    actions.setTrailing(0);
    actions.setAnimatePause(true);
    setTimeout(()=>{document.getElementById('deckgl-wrapper').focus()},1000)
    setTimeout(()=>{InitialFileRead1({...props,setPointData,setPolygonData,setPolygonDic})},200)
  },[])

  React.useEffect(()=>{
    actions.setMovesBase([]);
    if(pointData !== null && polygonDic !== null){
      let minElapsedtime = 2147483647;
      let maxElapsedtime = -2147483648;
      const setclusterList = []
      const filter = pointData.filter(x=>Array.isArray(x.xyz) && x.xyz.length > 0)
      const analyzeData = filter.map((data)=>{
        const { xyz, Color, time, text, ...others } = data;
        if(data.cluster !== undefined && !setclusterList.includes(+data.cluster)){
          setclusterList.push(+data.cluster)
        }
        if(polygonDic[others.AreaID]){
          const {Polygon,Color:polyColor,text:polytext="", cluster:polycluster, ...polyOthers} = polygonDic[others.AreaID][0]
          if(Array.isArray(xyz) && Array.isArray(xyz[0]) && xyz[0].length === 3){
            if(xyz.length > 1){
              const operation = xyz.map((elxyz,idx)=>{
                minElapsedtime = Math.min(minElapsedtime,time[idx]);
                maxElapsedtime = Math.max(maxElapsedtime,time[idx]+1);
                let settext = ""
                if(text && text[idx]){settext = text[idx]}
                return {polygon:Polygon, polyColor, position:elxyz, color:Color[idx], elapsedtime:time[idx], text:settext, polytext}
              })
              const lastIdx = xyz.length-1
              operation.push({polygon:Polygon, polyColor, position:xyz[lastIdx], color:Color[lastIdx], elapsedtime:(time[lastIdx]+1)})
              return {...polyOthers, polycluster, ...others, operation}
            }else{
              minElapsedtime = Math.min(minElapsedtime,time[0]);
              maxElapsedtime = Math.max(maxElapsedtime,time[0]+1);
              let settext = ""
              if(text && text[0]){settext = text[0]}
              return {...polyOthers, polycluster, ...others, operation:[
                {polygon:Polygon, polyColor, position:xyz[0], color:Color[0], elapsedtime:time[0], text:settext, polytext},
                {polygon:Polygon, polyColor, position:xyz[0], color:Color[0], elapsedtime:time[0]+1, text:settext}
              ]}
            }
          }else
          if(Array.isArray(xyz) && xyz.length === 3){
            minElapsedtime = Math.min(minElapsedtime,time);
            maxElapsedtime = Math.max(maxElapsedtime,time+1);
            return {...polyOthers, polycluster, ...others, operation:[
              {polygon:Polygon, polyColor, position:xyz, color:Color, elapsedtime:time, text:(text || ""), polytext},
              {polygon:Polygon, polyColor, position:xyz, color:Color, elapsedtime:time+1, text:(text || "")}
            ]}
          }else{
            return {...polyOthers, polycluster, ...others, operation:[{elapsedtime:time}]}
          }
        }else{
          if(Array.isArray(time)){
            const operation = time.map((eltime)=>{
              minElapsedtime = Math.min(minElapsedtime,eltime);
              maxElapsedtime = Math.max(maxElapsedtime,eltime);
              return {elapsedtime:eltime}
            })
            return {...others, operation}
          }else{
            minElapsedtime = Math.min(minElapsedtime,time);
            maxElapsedtime = Math.max(maxElapsedtime,time);
            return {...others, operation:[{elapsedtime:time}]}
          }
        }
      });
      console.log({analyzeData})
      actions.setTimeBegin(minElapsedtime)
      actions.setTimeLength(maxElapsedtime - minElapsedtime)
      actions.setMovesBase(analyzeData);
      setPolypoiMove(0)
      setSelectPointId([])
      setclusterList.sort((a, b) => (a - b))
      console.log({setclusterList})
      setClusterList(setclusterList.map((cluster)=>{
        return {cluster, check:true}
      }))
    }
  },[pointData,polygonDic])

  React.useEffect(()=>{
    if(polypoiMove <= 0 && polypoiMove > 200){
      setPolypoiData(positionData)
    }else{
      if(pointData !== null && polygonDic !== null){
        const transData = positionData.map((data)=>{
          const {polygon, position} = data
          const rate = polypoiMove/200
          const transCorner = polygon.map((corner)=>{
            return [
              corner[0] - (corner[0] - position[0]) * rate,
              corner[1] - (corner[1] - position[1]) * rate,
              corner[2] - (corner[2] - position[2]) * rate,
            ]
          })
          const transPosition = [
            polygon[0][0] - (polygon[0][0] - position[0]) * rate,
            polygon[0][1] - (polygon[0][1] - position[1]) * rate,
            polygon[0][2] - (polygon[0][2] - position[2]) * rate,
          ]
          return {...data, polygon:transCorner, position:transPosition}
        })
        setPolypoiData(transData)
      }
    }
  },[polypoiMove])

  React.useEffect(()=>{
    if(!loopEndPause){
      actions.setTime(timeBegin)
    }
  },[loopEndPause])

  const updateState = (updateData)=>{
    setState({...state, ...updateData})
  }

  const onHover = (el)=>{
    if (el && el.object) {
      const disptext = `AreaID:${el.object.AreaID}\n` +
      `X:${el.object.position[0]}\nY:${el.object.position[1]}\nZ:${el.object.position[2]}`
      updateState({ popup: [el.x, el.y, disptext] });
    } else {
      updateState({ popup: [0, 0, ''] });
    }
  }

  const onClick = (el)=>{
    if (el && el.layer && el.object && el.object.AreaID) {
      console.log(`id:${el.layer.id}`)
      if(el.layer.id === "PointCloudLayer" || el.layer.id === "SelPointCloudLayer" || el.layer.id === "PolygonLayer" || el.layer.id === "PolyPoiMoveLayer"){
        const index = selectPointId.findIndex((value)=>value === el.object.AreaID)
        if(index < 0){
          selectPointId.push(el.object.AreaID)
        }else{
          selectPointId.splice(index,1)
        }
        setSelectPointId(selectPointId)
      }
    }
  }

  const getPointCloudLayer = ()=>{
    if(polypoiMove === 0){return null}
    const opacity = polypoiMove / 200
    const currentData = App.autoPolypoiMoveId ? polypoiData : positionData
    const clusterdata = currentData.filter((x)=>{
      if(x.cluster === undefined){
        return true
      }else{
        const result = clusterList.find((el)=>el.cluster === x.cluster)
        if(result && result.check){
          return true
        }
      }
      return false
    })
    const selectdata = clusterdata.filter((x)=>selectPointId.includes(x.AreaID))
    return [
      new PointCloudLayer({
        id: 'PointCloudLayer',
        data: clusterdata,
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        getColor: x => x.color,
        pointSize: pointSiza,
        pickable: true,
        opacity: opacity,
        onHover,
        onClick
      }),
      new PointCloudLayer({
        id: 'SelPointCloudLayer',
        data: selectdata,
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        getColor: x => x.color,
        pointSize: pointSiza+2,
        pickable: true,
        opacity: opacity,
        onHover,
        onClick
      }),
      new TextLayer({
        id: 'TextLayer',
        data: clusterdata,
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        characterSet: 'auto',
        getText: x => x.text,
        getColor: x => x.color,
        getSize: x => textSiza * opacity,
        getTextAnchor: 'start',
        opacity: opacity,
      })
    ];
  }

  const getPolygonLayer = ()=>{
    if(polypoiMove > 0){
      const clusterdata = polypoiData.filter((x)=>{
        if(x.cluster === undefined){
          return true
        }else{
          const result = clusterList.find((el)=>el.cluster === x.polycluster)
          if(result && result.check){
            return true
          }
        }
        return false
      })
      if(clusterdata.length > 0){
        return new PolygonLayer({
          id: 'PolyPoiMoveLayer',
          data: clusterdata,
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
          getFillColor: x => x.polyColor,
          getLineWidth: 0.5,
          pickable: true,
          stroked: (viewState.zoom>9),
          lineWidthUnits: 'pixels',
          opacity: 1,
          onHover,
          onClick
        });
      }else{
        return null
      }
    }
    const clusterdata = positionData.filter((x)=>{
      if(x.cluster === undefined){
        return true
      }else{
        const result = clusterList.find((el)=>el.cluster === x.polycluster)
        if(result && result.check){
          return true
        }
      }
      return false
    })
    return [
      new PolygonLayer({
        id: 'PolygonLayer',
        data: clusterdata,
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        getFillColor: x => x.polyColor,
        getLineWidth: 0.5,
        pickable: true,
        stroked: (viewState.zoom>9),
        lineWidthUnits: 'pixels',
        opacity: 1,
        onHover,
        onClick
      }),
      new TextLayer({
        id: 'PolygonTextLayer',
        data: clusterdata,
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        characterSet: 'auto',
        getPosition: x=>x.polygon[0],
        getText: x => ` ${x.polytext}`,
        getColor: x => x.polyColor,
        getSize: x => textSiza,
        getTextAnchor: 'start',
        opacity: 1,
      }),
    ];
  }

  return (
    <Container {...props}>
      <Controller {...props} updateViewState={updateViewState} viewState={viewState}
      textSiza={textSiza} setTextSiza={setTextSiza}
      pointSiza={pointSiza} setPointSiza={setPointSiza}
      pointData={pointData} setPointData={setPointData}
      polygonData={polygonData} setPolygonData={setPolygonData}
      polygonDic={polygonDic} setPolygonDic={setPolygonDic}
      polypoiMove={polypoiMove} setPolypoiMove={setPolypoiMove}
      clusterList={clusterList} setClusterList={setClusterList}/>
      <div className="harmovis_area">
        <DeckGL
          views={new OrbitView({orbitAxis: 'Z', fov: 50})}
          viewState={viewState} controller={{scrollZoom:{smooth:true}}}
          onViewStateChange={v => updateViewState(v.viewState)}
          layers={[
              new LineLayer({
                id:'LineLayer',
                data: [
                  {sourcePosition:[50,0,0],targetPosition:[-50,0,0],color:[255,0,0,255]},
                  {sourcePosition:[0,50,0],targetPosition:[0,-50,0],color:[255,255,0,255]},
                  {sourcePosition:[0,0,50],targetPosition:[0,0,-50],color:[0,255,255,255]},
                ],
                coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
                getWidth: 1,
                widthMinPixels: 1,
                getColor: (x) => x.color || [255,255,255,255],
                opacity: 1,
              }),
              new TextLayer({
                id: 'LavelLayer',
                data: [
                  {coordinate:[52,0,0],text:'x',color:[255,0,0,255]},{coordinate:[-52,0,0],text:'x',color:[255,0,0,255]},
                  {coordinate:[0,52,0],text:'y',color:[255,255,0,255]},{coordinate:[0,-52,0],text:'y',color:[255,255,0,255]},
                  {coordinate:[0,0,52],text:'z',color:[0,255,255,255]},{coordinate:[0,0,-52],text:'z',color:[0,255,255,255]},
                ],
                coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
                characterSet: 'auto',
                getPosition: x => x.coordinate,
                getText: x => x.text,
                getColor: x => x.color || [0,255,0],
                getSize: x => 10,
                getTextAnchor: 'start',
                opacity: 1,
              }),
              positionData.length > 0 ? getPolygonLayer():null,
              positionData.length > 0 ? getPointCloudLayer():null,
          ]}
        />
      </div>
      <div className="harmovis_footer">
        target:{`[${viewState.target[0]},${viewState.target[1]},${viewState.target[2]}]`}&nbsp;
        rotationX:{viewState.rotationX}&nbsp;
        rotationOrbit:{viewState.rotationOrbit}&nbsp;
        zoom:{viewState.zoom}&nbsp;
      </div>
      <svg width={viewport.width} height={viewport.height} className="harmovis_overlay">
        <g fill="white" fontSize="12">
          {state.popup[2].length > 0 ?
            state.popup[2].split('\n').map((value, index) =>
              <text
                x={state.popup[0] + 10} y={state.popup[1] + (index * 12)}
                key={index.toString()}
              >{value}</text>) : null
          }
        </g>
      </svg>
      <LoadingIcon loading={loading} />
      <FpsDisplay />
    </Container>
  );
}
App.autoRotationId = null
App.autoPolypoiMoveId = null
export default connectToHarmowareVis(App);

const InitialFileRead1 = (props)=>{
  const { actions } = props;
  const request = new XMLHttpRequest();
  let pointData = null
  request.open('GET', 'data/PointDemoData.json');
  request.responseType = 'text';
  request.send();
  actions.setLoading(true);
  request.onload = function() {
    try {
      try {
        pointData = JSON.parse(request.response);
      } catch (exception) {
        actions.setLoading(false);
        return;
      }
      console.log({pointData})
      actions.setInputFilename({ PointFileName: 'PointDemoData.json' });
      const argProps = {...props, pointData}
      setTimeout(()=>{InitialFileRead2(argProps)},200)
    } catch (exception) {
      actions.setInputFilename({ PointFileName: null });
      actions.setInputFilename({ PolygonFileName: null });
      actions.setLoading(false);
      return;
    }
  }
}
const InitialFileRead2 = (props)=>{
  const { actions, pointData, setPointData, setPolygonData, setPolygonDic } = props;
  const request = new XMLHttpRequest();
  let polygonData = null
  request.open('GET', 'data/PolygonDemoData.json');
  request.responseType = 'text';
  request.send();
  request.onload = function() {
    try {
      try {
        polygonData = JSON.parse(request.response);
      } catch (exception) {
        actions.setInputFilename({ PointFileName: null });
        actions.setLoading(false);
        return;
      }
      console.log({polygonData})
      actions.setInputFilename({ PolygonFileName: 'PolygonDemoData.json' });
      const polygonDic = polygonData.reduce((prev,current)=>{
        if(String(current.AreaID) in prev){
          prev[current.AreaID].push(current)
        }else{
          prev[current.AreaID] = [current]
        }
        return prev
      })
      console.log({polygonDic})
      setPointData(pointData)
      setPolygonData(polygonData)
      setPolygonDic(polygonDic)
      actions.setRoutePaths([]);
      actions.setClicked(null);
      actions.setAnimatePause(true);
      actions.setAnimateReverse(false);
      actions.setLoading(false);
    } catch (exception) {
      actions.setInputFilename({ PointFileName: null });
      actions.setInputFilename({ PolygonFileName: null });
      actions.setLoading(false);
      return;
    }
  }
}
