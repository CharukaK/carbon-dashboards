import React from 'react';
import TextField from 'material-ui/TextField';
import Button from 'material-ui/Button';
import { createMuiTheme, MuiThemeProvider } from 'material-ui';
import _ from 'lodash';
import ReactTable from 'react-table';
import './resources/css/tableChart.css';
import { timeFormat } from 'd3-time-format';
import Widget from '@wso2-dashboards/widget';

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
                    datasourceName: 'S_GRID',
                    tableName: 'SG_SERVICES',
                    queryData: {
                        query: 'select * from SG_SERVICES',
                    },
                    incrementalColumn: 'STARTTIME',
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
                accessor: 'SERVICE',
                Cell: this.getNormalCellComponent
            },
            {
                Header: 'Transfer',
                accessor: 'FLOW_STATUS',
                Cell: this.getCellComponent,
                sortMethod: (a, b, desc) => {
                    if (a === 0 && b === 0 || a === 3 && b === 3) {
                        return 0;
                    } else if (a === 0 && b !== 3) {
                        return -1;
                    } else if (a === 3 && b !== 0) {
                        return -1;
                    } else if (a===0 && b===3) {
                        return 1;
                    } else if (a===3 && b===0) {
                        return -1;
                    } else if (a===3 || a===0) {
                        return -1;
                    } else if(b===0 || b === 3) {
                        return 1;
                    } else {
                        return 0;
                    }
                }
            },
            {
                Header: 'From Sys',
                accessor: 'FROM_SYS',
                Cell: this.getNormalCellComponent
            },
            {
                Header: 'To Sys',
                accessor: 'TO_SYS',
                Cell: this.getNormalCellComponent
            },
            {
                Header: 'Fault Description',
                accessor: 'FAULTDESCR',
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
                    fontSize: 14,
                }}
            >
                <div
                    style={{
                        width: `${Math.min(original['NB_EVENTS'] * 25, 100)}%`,
                        backgroundColor: original['FLOW_STATUS'] === 0 ? '#ff8000'
                            : original['FLOW_STATUS'] === 3 ? '#ff0000'
                                : '#219c38',
                        transition: 'all .2s ease-out',
                        padding: 5,
                    }}
                >
                    <span>
                        {
                            original['NB_EVENTS'] > 1 ?
                                `(${original['NB_EVENTS']}/${original['NB_EVENTS_TOTAL']}) ${original['DURATION']}ms` :
                                '(1)'
                        }
                    </span>
                </div>
            </div>
        )
    }

    getNormalCellComponent(props) {
        const { original } = props;

        return (
            <div
                style={{
                    color: this.state.selectedId && this.state.selectedId === props.original['SERVICE'] ? '#fff' : null,
                    textAlign: 'center',
                    background: this.state.selectedId && this.state.selectedId === props.original['SERVICE'] ?
                        '#438cad' : 'none',
                    padding: 5,
                    fontSize: 14,
                    textAlign: 'left'
                }}
            >
                {
                    props.column.id === 'STARTTIME' || props.column.id === 'ENDTIME' ?
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
            let arrIndex = _.findIndex(dataSet, (obj) => obj['SERVICE'] === recievedRow['SERVICE']);

            if (arrIndex > -1) {
                dataSet[arrIndex] = recievedRow;
            } else {
                dataSet.push(recievedRow);
            }
        });


        this.setState({ dataSet });

        // this.setState((prevState) => {
        //     prevState.dataSet = _.unionBy(prevState.dataSet, tmpArr, 'SERVICE');
        //     return prevState;
        // })
    }

    render() {
        let { dataSet, filterVal, page } = this.state;

        let theme = createMuiTheme({
            palette: {
                type: this.props.muiTheme.name,
            },
        });


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
                            className={this.props.muiTheme.name === 'light' ? 'lightTheme' : 'darkTheme'}
                            columns={this.tableConfig}
                            data={dataSet}
                            page={page}
                            defaultPageSize={10}
                            filtered={[{ // the current filters model
                                id: 'SERVICE',
                                value: filterVal,
                            }]}
                            onPageChange={page => this.setState({ page })}
                            getTrProps={
                                (state, rowInfo) => {
                                    return {
                                        onClick: (e) => {
                                            super.publish({
                                                service: rowInfo.original['SERVICE'],
                                                activity: rowInfo.original['ACTIVITY_ID']
                                            });
                                            this.setState({ selectedId: rowInfo.original['SERVICE'] })
                                        },
                                    };
                                }
                            }
                            defaultSorted={[
                                {
                                    id: 'FLOW_STATUS'
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

global.dashboard.registerWidget("SGServices", SG_SERVICES);
