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

class SGActivities extends Widget {

    constructor(props) {
        super(props);

        this.state = {
            id: props.id,
            width: props.glContainer.width,
            height: props.glContainer.height,
            dataSet: [],
            filterVal: '',
            filterStartTime: null,
            filterEndTime: null,
            page: 0,
            selectedId: null,
        };

        this.handleResize = this.handleResize.bind(this);
        this.props.glContainer.on('resize', this.handleResize);
        this.handleData = this.handleData.bind(this);
        this.getCellComponent = this.getCellComponent.bind(this);

        this.providerConfig = {
            configs: {
                type: 'RDBMSBatchDataProvider',
                config: {
                    datasourceName: 'S_GRID_DB',
                    tableName: 'SG_ACTIVITIES',
                    queryData: {
                        query: 'select activity_id, status, flow_status, starttime, endtime, duration, nb_events, service_name from SG_ACTIVITIES',
                    },
                    incrementalColumn: 'activity_id',
                    publishingInterval: 5,
                    publishingLimit: 100,
                    isPurgingEnable: false,
                    selectedId: '',
                }
            }
        };

        this.tableConfig = [
            {
                Header: 'Activity ID',
                accessor: 'activity_id',
                Cell: this.getCellComponent,
            },
            {
                Header: 'Status',
                accessor: 'status',
                Cell: this.getCellComponent,
            },
            {
                Header: 'Start Time',
                accessor: 'starttime',
                Cell: this.getCellComponent,
            },
            {
                Header: 'End Time',
                accessor: 'endtime',
                Cell: this.getCellComponent,
            },
            {
                Header: 'Duration',
                accessor: 'duration',
                Cell: this.getCellComponent,
            },
            {
                Header: 'nb_events',
                accessor: 'nb_events',
                Cell: this.getCellComponent,
            },
        ];
    }

    getCellComponent(props) {
        return (
            <div
                style={{
                    color: this.state.selectedId && this.state.selectedId === props.original['activity_id'] ? '#fff' : '#000',
                    textAlign: 'center',
                    background: this.state.selectedId && this.state.selectedId === props.original['activity_id'] ? '#438cad' :
                        props.original['flow_status'] === 1 ? '#9ce7aa' : '#fbb7a4',
                    padding: 0,
                }}
            >
                {
                    props.column.id === 'starttime' || props.column.id === 'endtime' ?
                        <span>{timeFormat('%m/%d/%Y, %I:%M:%S %p')(new Date(props.value))}</span> :
                        <span>{props.value}</span>
                }
            </div>
        )
    }

    componentDidMount() {
        super.getWidgetChannelManager().subscribeWidget(this.props.widgetID, this.handleData, this.providerConfig);
    }

    componentWillUnmount() {
        super.getWidgetChannelManager().unsubscribeWidget(this.props.widgetID);
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
            prevState.dataSet = _.unionBy(prevState.dataSet, tmpArr, 'activity_id');
            return prevState;
        })
    }

    render() {
        let { dataSet, filterVal, filterEndTime, filterStartTime, page } = this.state;
        return (
            <MuiThemeProvider theme={theme}>
                <div style={{ margin: '1% 2% 0 2%' }}>
                    <div style={{ height: 50, marginBottom: 25 }}>
                        <div style={{ width: '50%', float: 'left' }}>
                            <TextField
                                label="Start Date"
                                type="date"
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                style={{
                                    width: '48%',
                                    float: 'left',
                                }}
                                onSelect={(evt) => {
                                    let date = new Date(evt.target.value);
                                    date.setHours(0, 0, 0, 0);
                                    this.setState({
                                        page: 0,
                                        filterStartTime: date,
                                    })

                                }}
                            />
                            <TextField
                                label="End Date"
                                type="date"
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                style={{
                                    width: '48%',
                                    float: 'right',
                                }}
                                onChange={(evt) => {
                                    let date = new Date(evt.target.value);
                                    date.setHours(0, 0, 0, 0);
                                    this.setState({
                                        page: 0,
                                        filterEndTime: date,
                                    })

                                }}
                            />
                        </div>
                        <div style={{ width: '50%', float: 'right' }}>
                            <div
                                style={{
                                    width: '48%',
                                    float: 'right'
                                }}
                            >
                                <TextField
                                    label="Filter by Activity ID"
                                    style={{
                                        marginRight: 20
                                    }}
                                    onChange={(evt) => {
                                        this.setState({ page: 0, filterVal: evt.target.value })
                                    }}
                                    value={filterVal}
                                />
                                <Button variant="raised" color="primary" onClick={() => { this.setState({ filterVal: '', filterStartTime: null, filterEndTime: null, page: 0 }) }}>
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div style={{ clear: 'both' }}>
                        <ReactTable
                            columns={this.tableConfig}
                            data={
                                filterStartTime && filterEndTime ?
                                    _.filter(dataSet,
                                        (d) => (d.starttime > filterStartTime.getTime() && d.starttime < filterEndTime.getTime())) :
                                    dataSet
                            }
                            page={page}
                            defaultPageSize={10}
                            filtered={[{ // the current filters model
                                id: 'activity_id',
                                value: filterVal,
                            }]}
                            onPageChange={page => this.setState({ page })}
                            getTrProps={
                                (state, rowInfo) => {
                                    return {
                                        onClick: (e) => {
                                            super.publish({
                                                service: rowInfo.original['service_name'],
                                                activity: rowInfo.original['activity_id']
                                            });
                                            this.setState({ selectedId: rowInfo.original['activity_id'] })
                                        },
                                    };
                                }
                            }
                        />
                    </div>
                </div>
            </MuiThemeProvider>
        );
    }

    handleResize() {
        this.setState({ width: this.props.glContainer.width, height: this.props.glContainer.height });
    }
}

global.dashboard.registerWidget("SGActivities", SGActivities);
