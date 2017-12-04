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

export default class WidgetChannelManager {

    constructor() {
        this.webSocket = null;
        this.widgetMap = new Map();
        this.subscribeWidget = this.subscribeWidget.bind(this);
        this.unsubscribeWidget = this.unsubscribeWidget.bind(this);
        this._initializeProvider = this._initializeProvider.bind(this);
        this._initializeWebSocket = this._initializeWebSocket.bind(this);
        this._wsOnClose = this._wsOnClose.bind(this);
        this._wsOnError = this._wsOnError.bind(this);
        this._wsOnMessage = this._wsOnMessage.bind(this);

    }

    /**
     * Set a widget to the widget map and send configuration to the provider endpoint.
     * @param widgetId
     * @param callback
     * @param config
     */
    subscribeWidget(widgetId, callback, config) {
        this.widgetMap.set(widgetId, callback);
        config['action']= 'subscribe';
        config['topic']= widgetId;
        this.webSocket.send(JSON.stringify(config));
    }

    /**
     * remove a widget from the widget map
     * @param widgetId
     */
    unsubscribeWidget(widgetId) {
        this.widgetMap.delete(widgetId);
        let config = {
            topic: widgetId,
            providerName: null,
            dataProviderConfiguration: null,
            action: 'unsubscribe',
        };
        this.webSocket.send(JSON.stringify(config));
    }

    /**
     * Initialize websocket
     * @private
     */
    _initializeWebSocket() {
        this.webSocket = new WebSocket('wss://'); // TODO: finalize on the web-socket endpoint
        this.webSocket.onmessage = this._wsOnMessage;
        this.webSocket.onerror = this._wsOnError;
        this.webSocket.onclose = this._wsOnClose;
    }

    /**
     * handle web-socket on message event
     * @param message
     * @private
     */
    _wsOnMessage(message) {
        let data = JSON.parse(message.data);

        if(this.widgetMap.has(data.topic)) {
            this.widgetMap.get(data.topic)(data);
        } else {
            // TODO: Error logging
        }
    }

    /**
     * handle web-socket on error event
     * @param message
     * @private
     */
    _wsOnError(message) {
        // TODO: handle error message
    }

    /**
     * handle web-socket on close event
     * @param message
     * @private
     */
    _wsOnClose(message) {
        // TODO: handle on close event
    }

}
