import React from 'react';
import { createMuiTheme, MuiThemeProvider } from 'material-ui';
import _ from 'lodash';
import ReactTable from 'react-table';
import './resources/css/tableChart.css';
import { timeFormat } from 'd3-time-format';
import Widget from '@wso2-dashboards/widget';

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
                accessor: 'SERVICE_NAME',
                Cell: this.getNormalCellComponent
            },
            {
                Header: 'Activity ID',
                accessor: 'ACTIVITY_ID',
                Cell: this.getNormalCellComponent
            },
            {
                Header: 'File Name',
                accessor: 'FILE_NAME',
                Cell: this.getNormalCellComponent
            },
            {
                Header: 'Timestamp',
                accessor: 'TIMESTAMP',
                Cell: this.getNormalCellComponent
            },
            {
                Header: 'File Length',
                accessor: 'FILE_LENGTH',
                Cell: this.getNormalCellComponent
            }
        ];
    }

    getNormalCellComponent(props) {

        return (
            <div
                style={{
                    padding: 5,
                    fontSize: 14,
                    textAlign: 'left'
                }}
            >
                {
                    props.column.id === 'TIMESTAMP' ?
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
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);

        console.info(receivedMessage);
        let providerConfig = {
            configs: {
                type: 'RDBMSBatchDataProvider',
                config: {
                    datasourceName: 'S_GRID',
                    tableName: 'SG_EVENTS',
                    queryData: {
                        query: `select * from SG_EVENTS where SERVICE_NAME='${receivedMessage.service}' AND ACTIVITY_ID='${receivedMessage.activity}'`,
                    },
                    incrementalColumn: 'TIMESTAMP',
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

        let theme = createMuiTheme({
            palette: {
                type: this.props.muiTheme.name,
            },
        });

        return (
            <MuiThemeProvider theme={theme}>
                <div style={{ margin: '1% 2% 0 2%' }}>
                        <ReactTable
                            className={this.props.muiTheme.name === 'light' ? 'lightTheme' : 'darkTheme'}
                            columns={this.tableConfig}
                            data={
                                filterStartTime && filterEndTime ?
                                    _.filter(dataSet,
                                        (d) => (d.starttime > filterStartTime.getTime() && d.starttime < filterEndTime.getTime())) :
                                    dataSet
                            }
                            showPagination={false}
                            defaultSorted={[
                                {
                                    id: 'TIMESTAMP',
                                    desc: true,
                                }
                            ]}
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
