/*
*  Copyright (c) 2017, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
*
*  Licensed under the Apache License, Version 2.0 (the "License");
*  you may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*  http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
*/
import React from 'react';
import ExtendedWidget from "./ExtendedWidget";
import VizG from './chart-lib/VizG';

export default class UniversalGadget extends ExtendedWidget {

    constructor(props) {
        super(props.neededProps);
        this.state = {
            id: props.id,
            width: props.glContainer.width,
            height: props.glContainer.height,
            metadata: null,
            data: null,
            config: props.config['chart-conf'],
        };
        this.handleResize = this.handleResize.bind(this);
        this.props.glContainer.on('resize', this.handleRessssize);
        this.handleWidgetData = this.handleWidgetData.bind(this);
    }
    componentDidMount() {
        this.handleWidgetData = this.handleWidgetData.bind(this);
        let providerConfiguration = this.props.config['provider-conf'];
        super.getWidgetChannelManager().subscribeWidget(this.props.id,this.handleWidgetData,providerConfiguration);
    }

    componentWillUnmount(){
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
    }

    handleWidgetData(data) {
        console.info(data);
        this.setState({
            metadata: data.metadata,
            data: data.data
        })
    }

    renderWidget() {
        return(
            <VizG config={this.state.config} metadata={this.state.metadata} data={this.state.data} />
        );
    }

    handleResize() {
        this.setState({width: this.props.glContainer.width, height: this.props.glContainer.height});
    }
}

global.dashboard.registerWidget("UniversalGadget", UniversalGadget);