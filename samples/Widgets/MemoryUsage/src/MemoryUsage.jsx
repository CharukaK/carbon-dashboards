import React, { Component } from 'react';
import VizG from '../libs/react-vizgrammar/VizG.jsx';
import {VictoryChart} from 'victory';
var data = [];
const DATA_POINT_COUNT = 25;


class MemoryUsage extends Component {

    constructor(props) {
        super(props);
        this.state = {
            id: props.id,
            width: props.glContainer.width,
            height: props.glContainer.height,
            data: [],
            vis:null
        };
        this.handleResize = this.handleResize.bind(this);
        this.props.glContainer.on('resize', this.handleResize);

        this.publishData = this.publishData.bind(this);
        const self = this;
        const ws = new WebSocket('ws://localhost:8080/server-stats/memory');
        ws.onmessage = function(event) {
            self.publishData(event.data);
        };

        this.divRef=null;

        this.metadata={
            names:['timestamp','value'],
            types:['linear','linear']
        };

        this.config={
            x:'timestamp',
            charts:[{y:'value'}],
            height:800,
            width:400,
            maxLength:30
        };

    }

    componentDidMount(){
        let {vis}=this.state;
        vis=new vizg({metadata:this.metadata,data:this.state.data},this.config);

        vis.draw(this.divRef);

        this.setState({
            vis:vis
        })
    }

    formatDateLabel(dt) {
        let h = dt.getHours();
        let m = dt.getMinutes();
        let s = dt.getSeconds();
        return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
    }

    publishData(memoryUsage) {
        let {vis}=this.state;
        data.push([this.formatDateLabel(new Date()), memoryUsage * 100]);

        let arr = [];
        let count = data.length > DATA_POINT_COUNT ? data.length : DATA_POINT_COUNT;
        for (var i = 0; i < count; i++) {
            arr.push(data[i] || [ '',null]);
        }

        if (arr.length > DATA_POINT_COUNT) {
            arr = arr.slice(arr.length - DATA_POINT_COUNT);
        }

        vis.insert(arr);

        this.setState({
            vis:vis
        })

        // this.setState({
        //     data: arr
        // });
        //setTimeout(this.publishData, Math.round(1000 / REFRESH_RATE));
    }

    render() {
        return (
            <section id={'sectionShit'}>

                {/*<VictoryChart*/}
                    {/*height={800}*/}
                    {/*width={900}*/}

                {/*>*/}


                <div ref={(ref)=>{this.divRef=ref}}>

                </div>
                {/*</VictoryChart>*/}
            </section>
        );
    }

    handleResize() {
        this.setState({width: this.props.glContainer.width, height: this.props.glContainer.height});
    }

}

global.dashboard.registerWidget('MemoryUsage', MemoryUsage);
