import React from 'react';
import TextField from 'material-ui/TextField';
import Button from 'material-ui/Button';
import { createMuiTheme, MuiThemeProvider } from 'material-ui';
import _ from 'lodash';
import ReactTable from 'react-table';
import './resources/css/tableChart.css';
import { timeFormat } from 'd3-time-format';
import Widget from '@wso2-dashboards/widget';



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
                    datasourceName: 'S_GRID',
                    tableName: 'SG_ACTIVITIES',
                    queryData: {
                        query: 'select ACTIVITY_ID, STATUS, FLOW_STATUS, STARTTIME, ENDTIME, DURATION, NB_EVENTS, SERVICE_NAME from SG_ACTIVITIES',
                    },
                    incrementalColumn: 'ACTIVITY_ID',
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
                accessor: 'ACTIVITY_ID',
                Cell: this.getCellComponent,
            },
            {
                Header: 'Events',
                accessor: 'NB_EVENTS',
                Cell: this.getCellComponent,
                maxWidth: 70,
            },
            {
                Header: 'Status',
                accessor: 'STATUS',
                Cell: this.getCellComponent,
                maxWidth: 90,
            },
            {
                Header: 'Start Time',
                accessor: 'STARTTIME',
                Cell: this.getCellComponent,
                maxWidth: 170,
            },
            {
                Header: 'End Time',
                accessor: 'ENDTIME',
                Cell: this.getCellComponent,
                maxWidth: 170,
            },
            {
                Header: 'Duration',
                accessor: 'DURATION',
                Cell: this.getCellComponent,
                maxWidth: 90,
            },
        ];
    }

    getCellComponent(props) {
        return (
            <div
                style={{
                    color: this.state.selectedId && this.state.selectedId === props.original['ACTIVITY_ID'] ? '#fff' : '#000',
                    textAlign: props.column.id === 'NB_EVENTS' || props.column.id === 'DURATION' ? 'right' : 'left',
                    background: this.state.selectedId && this.state.selectedId === props.original['ACTIVITY_ID'] ? '#438cad' :
                        props.original['FLOW_STATUS'] === 1 ? '#9ce7aa' : '#fbb7a4',
                    padding: 5,
                    fontSize: 14,
                }}
            >
                {
                    props.column.id === 'STARTTIME' || props.column.id === 'ENDTIME' ?
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
        const { dataSet } = this.state;

        let tmpArr = [];

        response.data.forEach((datum) => {
            let obj = {};
            for (let i = 0; i < response.metadata.names.length; i++) {
                obj[response.metadata.names[i]] = datum[i];
            }
            tmpArr.push(obj);
        });

        tmpArr.forEach(recievedRow => {
            let arrIndex = _.findIndex(dataSet, (obj) => obj['ACTIVITY_ID'] === recievedRow['ACTIVITY_ID']);

            if(arrIndex > -1) {
                dataSet[arrIndex] = recievedRow;
            } else {
                dataSet.push(recievedRow);
            }
        });


        this.setState({ dataSet });
    }

    render() {
        let { dataSet, filterVal, filterEndTime, filterStartTime, page } = this.state;

        let theme = createMuiTheme({
            palette: {
                type: this.props.muiTheme.name,
            },
        });

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
                            className={this.props.muiTheme.name === 'light' ? 'lightTheme' : 'darkTheme'}
                            columns={this.tableConfig}
                            data={
                                filterStartTime && filterEndTime ?
                                    _.filter(dataSet,
                                        (d) => {
                                            return d.STARTTIME > filterStartTime.getTime() && d.STARTTIME < filterEndTime.getTime();
                                        }) :
                                    dataSet
                            }
                            page={page}
                            defaultPageSize={10}
                            filtered={[{ // the current filters model
                                id: 'ACTIVITY_ID',
                                value: filterVal,
                            }]}
                            onPageChange={page => this.setState({ page })}
                            getTrProps={
                                (state, rowInfo) => {
                                    return {
                                        onClick: (e) => {
                                            super.publish({
                                                service: rowInfo.original['SERVICE_NAME'],
                                                activity: rowInfo.original['ACTIVITY_ID']
                                            });
                                            this.setState({ selectedId: rowInfo.original['ACTIVITY_ID'] })
                                        },
                                    };
                                }
                            }

                            defaultSorted={[
                                {
                                    id: 'NB_EVENTS'
                                },
                                {
                                    id: 'ENDTIME',
                                    desc: true,
                                }
                            ]}
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
