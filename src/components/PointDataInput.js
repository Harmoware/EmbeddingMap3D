import React from 'react';

export const PointDataInput = (props)=>{
    const { actions, id, setPointData } = props;

    const onSelect = (e)=>{
        const reader = new FileReader();
        const file = e.target.files[0];
        if (!file) {
            return;
        }
        actions.setLoading(true);
        setPointData(null)
        actions.setInputFilename({ PointFileName: null });
        reader.readAsText(file);
        const file_name = file.name;
        reader.onload = () => {
            try {
                let pointData = null
                try {
                    pointData = JSON.parse(reader.result.toString());
                } catch (exception) {
                    actions.setLoading(false);
                    return;
                }
                console.log({pointData})
                setPointData(pointData)
                actions.setInputFilename({ PointFileName: file_name });
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
        actions.setInputFilename({ PointFileName: null });
        setPointData(null)
        e.target.value = '';
    };

    return (<>{React.useMemo(()=>
        <input type="file" accept=".json"
        id={id} onChange={onSelect} onClick={onClick} />,[])}</>)
}
