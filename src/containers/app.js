import React, { useState } from 'react';
import DeckGL from '@deck.gl/react';
import { PointCloudLayer, LineLayer, COORDINATE_SYSTEM, TextLayer, OrbitView, PolygonLayer } from 'deck.gl';
import {
  Container, connectToHarmowareVis, LoadingIcon, FpsDisplay
} from 'harmoware-vis';
import Clustering from 'density-clustering';
import Controller from '../components';

const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN; //Acquire Mapbox accesstoken

const INITIAL_VIEW_STATE = {
  target: [0, 0, 0],
  rotationX: 5,
  rotationOrbit: -5,
  zoom: 8.5
};
const kmeans = new Clustering.KMEANS()
const clusterColors = [
  [0x1f,0x77,0xb4],
  [0xff,0x7f,0x0e],
  [0x2c,0xa0,0x2c],
  [0xd6,0x27,0x28],
  [0x94,0x67,0xbd],
  [0x8c,0x56,0x4b],
  [0xe3,0x77,0xc2],
  [0x7f,0x7f,0x7f],
  [0xbc,0xbd,0x22],
  [0x17,0xbe,0xcf],
]

const App = (props)=>{
  const [state,setState] = useState({ popup: [0, 0, ''] })
  const [viewState, updateViewState] = useState(INITIAL_VIEW_STATE);
  const [saveDataset, setDataset] = useState([[]])
  const [clusterNum, setClusterNum] = useState(10);
  const [textSiza, setTextSiza] = useState(10);
  const [pointSiza, setPointSiza] = useState(1);
  const [clusterColor, setClusterColor] = useState(undefined);
  const [shikibetuTbl, setShikibetuTbl] = useState([]);
  const [selectPointId, setSelectPointId] = useState([]);
  const [pointData, setPointData] = useState(null);
  const [polygonData, setPolygonData] = useState(null);
  const [polygonDic, setPolygonDic] = useState(null);
  const { actions, viewport, movesbase, movedData, loading, settime } = props;

  const text3dData = movedData.filter(x=>x.position)
  const dataset = text3dData.map((x)=>x.position).sort((a,b)=>{a[0]-b[0]})

  React.useEffect(()=>{
    setTimeout(()=>{InitialFileRead1({...props,setPointData,setPolygonData,setPolygonDic})},200)
  },[])

  React.useEffect(()=>{
    if(pointData !== null && polygonDic !== null){
      const analyzeData = pointData.map((data)=>{
          const { xyz, Color, ...others } = data;
          if(polygonDic[others.AreaID]){
              const {Polygon,Color:polyColor,...polyOthers} = polygonDic[others.AreaID][0]
              return {...polyOthers, ...others, operation:[
                  {polygon:Polygon, polyColor, position:xyz, color:Color, elapsedtime:0},
                  {polygon:Polygon, polyColor, position:xyz, color:Color, elapsedtime:1}
              ]}
          }else{
              return {...others, operation:[
                  {position:xyz, color:Color, elapsedtime:0},
                  {position:xyz, color:Color, elapsedtime:1}
              ]}
          }
      });
      console.log({analyzeData})
      actions.setMovesBase(analyzeData);
    }
  },[pointData,polygonDic])

  React.useEffect(()=>{
    if(movesbase.length === 0){
      setClusterColor(undefined)
      setShikibetuTbl([])
    }
  },[movesbase])

  let flg = false
  if(dataset.length !== saveDataset.length){
    flg = true
    setDataset(dataset)
  }else{
    for(let i=0; i > dataset.length; i=i+1){
      if(dataset[i].length !== saveDataset[i].length){
        flg = true
        setDataset(dataset)
        break
      }else{
        for(let j=0; j > dataset.length; j=j+1){
          if(dataset[i][j] !== saveDataset[i][j]){
            flg = true
            setDataset(dataset)
            break
          }
        }
      }
    }
  }
  if(flg){
    if(clusterColor === undefined && dataset.length>0){
      const clusters = kmeans.run(dataset, clusterNum)
      clusters.sort((a, b) => (a[0] - b[0]))
      const wkClusterColor = text3dData.reduce((prev,current,idx)=>{
        for(let i=0; i<clusters.length; i=i+1){
          if(clusters[i].includes(idx)){
            prev[current.shikibetu] = clusterColors[i]
            return prev
          }
        }
        prev[current.shikibetu] = [255,255,255,255]
        return prev
      },{})
      setClusterColor(wkClusterColor)
    }
  }

  React.useEffect(()=>{
    if(dataset.length>0){
      const clusters = kmeans.run(dataset, clusterNum)
      clusters.sort((a, b) => (a.length - b.length))
      const wkClusterColor = text3dData.reduce((prev,current,idx)=>{
        for(let i=0; i<clusters.length; i=i+1){
          if(clusters[i].includes(idx)){
            prev[current.shikibetu] = clusterColors[i]
            return prev
          }
        }
        prev[current.shikibetu] = [255,255,255,255]
        return prev
      },{})
      setClusterColor(wkClusterColor)
    }
  },[clusterNum])

  React.useEffect(()=>{
    actions.setInitialViewChange(false);
    actions.setSecPerHour(3600);
    actions.setLeading(0);
    actions.setTrailing(0);
    actions.setAnimatePause(true);
  },[])

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
      if(el.layer.id === "PointCloudLayer" || el.layer.id === "SelPointCloudLayer" || el.layer.id === "PolygonLayer"){
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

  const getTextSize = (x)=>{
    if(shikibetuTbl.length === 0 || shikibetuTbl.includes(x.shikibetu)){
      return textSiza
    }
    return 0
  }

  const getPointCloudLayer = (text3dData)=>{
    return new PointCloudLayer({
      id: 'PointCloudLayer',
      data: text3dData,
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      getPosition: x => x.position,
      getColor: x => x.color,
      pointSize: pointSiza,
      pickable: true,
      onHover,
      onClick
    });
  }

  const getSelPointCloudLayer = (text3dData)=>{
    const dspdata = text3dData.filter((x)=>selectPointId.includes(x.AreaID))
    return new PointCloudLayer({
      id: 'SelPointCloudLayer',
      data: dspdata,
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      getPosition: x => x.position,
      getColor: x => x.color,
      pointSize: pointSiza+2,
      pickable: true,
      onHover,
      onClick
    });
  }

  const getPolygonLayer = (text3dData)=>{
    const polygonData = text3dData.filter(x=>x.polygon)
    return new PolygonLayer({
      id: 'PolygonLayer',
      data: polygonData,
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      getFillColor: x => x.polyColor,
      pickable: true,
      stroked: false,
      opacity: 0.5,
      onHover,
      onClick
    });
  }

  return (
    <Container {...props}>
      <Controller {...props} updateViewState={updateViewState} viewState={viewState}
      clusterNum={clusterNum} setClusterNum={setClusterNum}
      textSiza={textSiza} setTextSiza={setTextSiza}
      pointSiza={pointSiza} setPointSiza={setPointSiza}
      pointData={pointData} setPointData={setPointData}
      polygonData={polygonData} setPolygonData={setPolygonData}
      polygonDic={polygonDic} setPolygonDic={setPolygonDic}/>
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
              text3dData.length > 0 ? getPointCloudLayer(text3dData):null,
              text3dData.length > 0 ? getSelPointCloudLayer(text3dData):null,
              text3dData.length > 0 ? getPolygonLayer(text3dData):null,
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
export default connectToHarmowareVis(App);

const InitialFileRead1 = (props)=>{
  const { actions } = props;
  const request = new XMLHttpRequest();
  let pointData = null
  request.open('GET', 'data/PointDemoData.json');
  request.responseType = 'text';
  request.send();
  actions.setLoading(true);
  actions.setMovesBase([]);
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
