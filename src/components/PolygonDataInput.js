import React from 'react';

export const PolygonDataInput = (props)=>{
    const { actions, id, setPolygonData, setPolygonDic } = props;

    const onSelect = (e)=>{
        const reader = new FileReader();
        const file = e.target.files[0];
        if (!file) {
            return;
        }
        actions.setLoading(true);
        setPolygonData(null)
        setPolygonDic(null)
        actions.setInputFilename({ PolygonFileName: null });
        reader.readAsText(file);
        const file_name = file.name;
        reader.onload = () => {
            try {
                let polygonData = null
                try {
                    polygonData = JSON.parse(reader.result.toString());
                } catch (exception) {
                    actions.setLoading(false);
                    return;
                }
                console.log({polygonData})
                const polygonDic = polygonData.reduce((prev,current)=>{
                    if(String(current.AreaID) in prev){
                      prev[current.AreaID].push(current)
                    }else{
                      prev[current.AreaID] = [current]
                    }
                    return prev
                })
                setPolygonData(polygonData)
                actions.setInputFilename({ PolygonFileName: file_name });
                setPolygonDic(polygonDic)
            } catch (exception) {
                actions.setLoading(false);
                return;
            }
            actions.setAnimatePause(true);
            actions.setAnimateReverse(false);
            actions.setLoading(false);
        };
    };

    const onClick = (e)=>{
        actions.setInputFilename({ PolygonFileName: null });
        setPolygonData(null)
        setPolygonDic(null)
        e.target.value = '';
    };

    return (<>{React.useMemo(()=>
        <input type="file" accept=".json"
        id={id} onChange={onSelect} onClick={onClick} />,[])}</>)
}
