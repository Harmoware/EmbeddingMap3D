import React from 'react';

export const Text3dDataInput = (props)=>{
    const { actions, id } = props;

    const onSelect = (e)=>{
        const reader = new FileReader();
        const file = e.target.files[0];
        if (!file) {
            return;
        }
        actions.setLoading(true);
        actions.setMovesBase([]);
        reader.readAsText(file);
        const file_name = file.name;
        reader.onload = () => {
            const linedata = reader.result.toString().split(/(\r\n|\n)/);
            const readdata = linedata.map((lineArray)=>{
                return lineArray.split(',')
            })
            const dataLength = readdata[0].length
            const filterData = readdata.filter((data)=>data.length===dataLength)
            let endTime = Number.MIN_SAFE_INTEGER
            const workData = filterData.map((data)=>{
                const [strElapsedtime,shikibetu,x,y,z,text] = data
                const elapsedtime = parseInt(strElapsedtime)*10
                endTime = Math.max(endTime,elapsedtime)
                return {
                    elapsedtime:elapsedtime,
                    shikibetu:parseInt(shikibetu),
                    position: [parseFloat(x),parseFloat(y),parseFloat(z)],
                    text: text.slice(1,-1),
                }
            })
            const idTable = workData.reduce((prev,current)=>{
                if(String(current.shikibetu) in prev){
                    prev[current.shikibetu].push(current)
                }else{
                    prev[current.shikibetu] = [current]
                }
                return prev
            },{})
            const text3dData = Object.values(idTable).map((data)=>{
                data.push({elapsedtime:endTime+1})
                return {operation:data}
            })
            console.log({text3dData})
            actions.setInputFilename({ text3dDataFileName: file_name });
            actions.setMovesBase(text3dData)
            actions.setAnimatePause(true);
            actions.setLoading(false);
        };
    };

    const onClick = (e)=>{
        actions.setInputFilename({ text3dDataFileName: null });
        actions.setMovesBase([]);
        e.target.value = '';
    };

    return (<>{React.useMemo(()=>
        <input type="file" accept=".csv"
        id={id} onChange={onSelect} onClick={onClick} />,[])}</>)
}
