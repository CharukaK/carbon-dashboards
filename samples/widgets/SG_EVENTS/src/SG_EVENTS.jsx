import React from 'react';
import TextField from 'material-ui/TextField';
import Button from 'material-ui/Button';
import { createMuiTheme, MuiThemeProvider } from 'material-ui';
import _ from 'lodash';
import ReactTable from 'react-table';
import './resources/css/tableChart.css';
import { timeFormat } from 'd3-time-format';
import Widget from '@wso2-dashboards/widget';

const theme = createMuiTheme({
    palette: {
        type: 'dark',
    },
});

class SG_EVENTS extends Widget {

    constructor(props) {
        super(props);

        this.state = {
            id: props.id,
            width: props.glContainer.width,
            height: props.glContainer.height,
            dataSet: [],
        };

        this.handleResize = this.handleResize.bind(this);
        this.props.glContainer.on('resize', this.handleResize);
        this.handleData = this.handleData.bind(this);
        this.getNormalCellComponent = this.getNormalCellComponent.bind(this);
        this.setReceivedMsg = this.setReceivedMsg.bind(this);

        this.tableConfig = [
            {
                Header: 'Service Name',
                accessor: 'service_name',
                Cell: this.getNormalCellComponent
            },
            {
                Header: 'Activity ID',
                accessor: 'activity_id',
                Cell: this.getNormalCellComponent
            },
            {
                Header: 'File Name',
                accessor: 'file_name',
                Cell: this.getNormalCellComponent
            },
            {
                Header: 'Timestamp',
                accessor: 'timestamp',
                Cell: this.getNormalCellComponent
            },
            {
                Header: 'File Length',
                accessor: 'file_length',
                Cell: this.getNormalCellComponent
            }
        ];
    }

    getNormalCellComponent(props) {

        return (
            <div
                style={{
                    color: this.state.selectedId && this.state.selectedId === props.original['service'] ? '#fff' : '#000',
                    textAlign: 'center',
                    background: this.state.selectedId && this.state.selectedId === props.original['service'] ?
                        '#438cad' : '#fff',
                    padding: 0,
                }}
            >
                {
                    props.column.id === 'starttime' || props.column.id === 'endtime' ?
                        <span>{timeFormat('%m/%d/%Y, %I:%M:%S %p')(new Date(props.value))}</span> :
                        <span>{props.value}</span>
                }
            </div>
        );
    }

    componentWillMount() {
        super.subscribe(this.setReceivedMsg);
    }

    setReceivedMsg(receivedMessage) {
        console.info(receivedMessage);
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);


        let providerConfig = {
            configs: {
                type: 'RDBMSBatchDataProvider',
                config: {
                    datasourceName: 'S_GRID_DB',
                    tableName: 'SG_EVENTS',
                    queryData: {
                        query: `select * from SG_EVENTS where service_name='${receivedMessage.service}' AND activity_id='${receivedMessage.activity}'`,
                    },
                    incrementalColumn: 'activity_id',
                    publishingInterval: 5,
                    publishingLimit: 100,
                    isPurgingEnable: false,
                    selectedId: '',
                }
            }
        };

        super.getWidgetChannelManager().subscribeWidget(this.props.id, this.handleData, providerConfig);

    }

    componentDidMount() {
    }

    componentWillUnmount() {
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
    }

    handleData(response) {
        let tmpArr = [];

        response.data.forEach((datum) => {
            let obj = {};
            for (let i = 0; i < response.metadata.names.length; i++) {
                obj[response.metadata.names[i]] = datum[i];
            }
            tmpArr.push(obj);
        });

        this.setState((prevState) => {
            prevState.dataSet = tmpArr;
            return prevState;
        })
    }



    render() {
        let { dataSet, filterEndTime, filterStartTime } = this.state;
        return (
            <MuiThemeProvider theme={theme}>
                <div style={{ margin: '1% 2% 0 2%' }}>
                        <ReactTable
                            columns={this.tableConfig}
                            data={
                                filterStartTime && filterEndTime ?
                                    _.filter(dataSet,
                                        (d) => (d.starttime > filterStartTime.getTime() && d.starttime < filterEndTime.getTime())) :
                                    dataSet
                            }
                        />
                    </div>
            </MuiThemeProvider>
        );
    }

    handleResize() {
        this.setState({ width: this.props.glContainer.width, height: this.props.glContainer.height });
    }
}

global.dashboard.registerWidget("SGEvents", SG_EVENTS);
