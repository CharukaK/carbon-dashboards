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

class SG_SERVICES extends Widget {

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
        this.getNormalCellComponent = this.getNormalCellComponent.bind(this);

        this.providerConfig = {
            configs: {
                type: 'RDBMSBatchDataProvider',
                config: {
                    datasourceName: 'S_GRID_DB',
                    tableName: 'SG_SERVICES',
                    queryData: {
                        query: 'select * from SG_SERVICES',
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
                Header: 'Service',
                accessor: 'service',
                Cell: this.getNormalCellComponent
            },
            {
                Header: 'Transfer',
                accessor: 'activity_id',
                Cell: this.getCellComponent
            },
            {
                Header: 'From Sys',
                accessor: 'from_sys',
                Cell: this.getNormalCellComponent
            },
            {
                Header: 'To Sys',
                accessor: 'to_sys',
                Cell: this.getNormalCellComponent
            },
            {
                Header: 'Fault Description',
                accessor: 'faultdescr',
                Cell: this.getNormalCellComponent
            }
        ];
    }

    getCellComponent(props) {
        const { original } = props;
        return (
            <div
                style={{
                    background: '#dadada',
                    padding: 0,
                }}
            >
                <div
                    style={{
                        width: `${Math.min(original['nb_events']*25, 100)}%`,
                        backgroundColor: original['flow_status'] === 0 ? '#ff8000'
                            : original['flow_status'] === 3 ? '#ff0000'
                                : '#219c38',
                        transition: 'all .2s ease-out',
                        padding: 0,
                    }}
                >
                    <span>{original['nb_events'] > 1 ? `(${original['nb_events']}/${original['nb_events_total']}) ${original['duration']}ms` : '(1)' }</span>
                </div>
            </div>
        )
    }

    getNormalCellComponent(props) {
        const { original } = props;

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

    componentDidMount() {
        super.getWidgetChannelManager().subscribeWidget(this.props.id, this.handleData, this.providerConfig);
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
            prevState.dataSet = _.unionBy(prevState.dataSet, tmpArr, 'service');
            return prevState;
        })
    }

    render() {
        let { dataSet, filterVal, filterEndTime, filterStartTime, page } = this.state;

        return (
            <MuiThemeProvider theme={theme}>
                <div style={{ margin: '1% 2% 0 2%' }}>
                    <div style={{ height: 50, marginBottom: 25 }}>
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
                                id: 'service',
                                value: filterVal,
                            }]}
                            onPageChange={page => this.setState({ page })}
                            getTrProps={
                                (state, rowInfo) => {
                                    return {
                                        onClick: (e) => {
                                            super.publish({
                                                service: rowInfo.original['service'],
                                                activity: rowInfo.original['activity_id']
                                            });
                                            this.setState({ selectedId: rowInfo.original['service'] })
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

global.dashboard.registerWidget("SGServices", SG_SERVICES);
