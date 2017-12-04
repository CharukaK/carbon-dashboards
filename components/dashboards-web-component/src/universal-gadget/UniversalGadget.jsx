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
import ExtendedWidget from "./ExtendedWidget";
import VizG from './VizG/VizG';

export default class UniversalGadget extends ExtendedWidget {

    constructor(props) {
        super(props);
        this.state = {
            metadata: null,
            data: null,
            config: {
                x: 'rpm',
                charts: [
                    {type: 'line', y: 'horsepower', fill: '#2ca02c'},
                    {type: 'line', y: 'torque', fill: '#ff7f0e'},
                ],
                maxLength: 7,
                width: 700,
                height: 450,
            },
        }
    }

    componentDidMount() {
        this.handleWidgetData = this.handleWidgetData.bind(this);
        let providerConfiguration = {
            providerName: 'RDBMSBatchDataProvider',
            dataProviderConfiguration: {
                datasourceName: 'DEMO_DB',
                query: 'select * from FraudTable',
                tableName: 'FraudTable',
                incrementalColumn: 'PersonID',
                publishingInterval: 5,
                purgingInterval: 5,
                publishingLimit: 1000,
                purgingLimit: 1000,
                isPurgingEnable: false,
            }
        };
        super.getWidgetChannelManager().subscribeWidget(this.props.id,this.handleWidgetData,providerConfiguration);
    }

    componentWillUnmount(){
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
    }

    handleWidgetData(data) {
        this.setState({
            metadata: data.metadata,
            data: data.data
        })
    }

    render() {
        return(
            <VizG config={this.state.config} metadata={this.state.metadata} data={this.state.data} />
        );
    }
}
