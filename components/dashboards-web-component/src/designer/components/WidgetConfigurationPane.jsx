/*
 * Copyright (c) 2018, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { IconButton, Paper } from 'material-ui';
import { NavigationArrowForward } from 'material-ui/svg-icons';
import { Event } from '../../utils/Constants';

const styles = {
    backdrop: {
        position: 'fixed',
        height: '100%',
        width: '100%',
        top: '0px',
        left: '0px',
        opacity: 1,
        willChange: 'opacity',
        transform: 'translateZ(0px)',
        transition: 'left 0ms cubic-bezier(0.23, 1, 0.32, 1) 0ms, opacity 400ms cubic-bezier(0.23, 1, 0.32, 1) 0ms',
        pointerEvents: 'auto',
    },
};

export default class WidgetConfigurationPane extends Component {
    constructor(props) {
        super(props);
        this.state = {
            clickedOnBackdrop: false,
        };

        this.getPublisherWidgetsConfigurations = this.getPublisherWidgetsConfigurations.bind(this);
        this.getSelectedWidgetConfiguration = this.getSelectedWidgetConfiguration.bind(this);
        this.triggerEvent = this.triggerEvent.bind(this);
        this.handlePaneClose = this.handlePaneClose.bind(this);
        this.updateWidget = this.updateWidget.bind(this);
    }

    getPublisherWidgetsConfigurations() {
        return this.props.widgetsConfigurations.filter((widgetConfiguration) => {
            return (widgetConfiguration.configs.pubsub.types.indexOf('publisher') !== -1);
        });
    }

    getSelectedWidgetConfiguration() {
        const selectedWidgetName = this.props.widgetGoldenLayoutContent.config.title;
        return this.props.widgetsConfigurations.find((widgetConfiguration) => {
            return (widgetConfiguration.id === selectedWidgetName);
        });
    }

    triggerEvent(eventName, parameter) {
        this.props.widgetGoldenLayoutContent.layoutManager.eventHub.trigger(eventName, parameter);
    }

    handlePaneClose() {
        this.setState({ clickedOnBackdrop: true });
        this.props.paneCloseEventListener();
    }

    updateWidget() {
        const newConfig = this.props.widgetGoldenLayoutContent.config;
        this.triggerEvent(Event.DASHBOARD_DESIGNER_WIDGET_CONFIG_UPDATE, newConfig);
    }

    renderBackdrop(theme) {
        return (
            <div
                style={{
                    ...styles.backdrop,
                    backgroundColor: theme.overlay.backgroundColor,
                    zIndex: theme.zIndex.drawerOverlay,
                }}
                onClick={this.handlePaneClose}
            />
        );
    }

    render() {
        if (!this.props.widgetGoldenLayoutContent) {
            return null;
        }

        const theme = this.props.theme;
        const isOpen = this.state.clickedOnBackdrop ? false : this.props.isOpen;
        this.state.clickedOnBackdrop = false;
        return (
            <span>
                <Paper
                    style={{
                        position: 'fixed',
                        top: theme.appBar.height,
                        width: 300,
                        right: (isOpen ? 0 : -300),
                        height: '100%',
                        paddingBottom: 80,
                        overflowX: 'hidden',
                        overflowY: 'auto',
                        backgroundColor: theme.drawer.color,
                        zIndex: theme.zIndex.drawer,
                    }}
                >
                    <div>
                        <IconButton tooltip="Back" onClick={this.handlePaneClose}>
                            <NavigationArrowForward />
                        </IconButton>
                        <div style={{ display: 'inline-block' }}>
                            {this.props.widgetGoldenLayoutContent.config.component}
                        </div>
                        <div>widget pub-sub configuration goes here</div>
                        <div>widget other configuration goes here</div>
                    </div>
                </Paper>
                {isOpen ? this.renderBackdrop(theme) : null}
            </span>
        );
    }
}

WidgetConfigurationPane.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    widgetGoldenLayoutContent: PropTypes.shape({}).isRequired,
    widgetsConfigurations: PropTypes.arrayOf({
        name: PropTypes.string.isRequired,
        id: PropTypes.string.isRequired,
        configs: PropTypes.shape({}).isRequired,
    }).isRequired,
    theme: PropTypes.shape({}).isRequired,
    paneCloseEventListener: PropTypes.func.isRequired,
};
