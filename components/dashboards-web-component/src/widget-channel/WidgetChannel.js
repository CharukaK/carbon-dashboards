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

export default class WidgetChannel {
    constructor() {
        this.registerWidgetCallback = this.registerWidgetCallback.bind(this);
        this.unregisterWidgetCallback = this.unregisterWidgetCallback.bind(this);
        this.initiateProvider = this.initiateProvider.bind(this);
        this._directDataToCallbak = this._directDataToCallbak.bind(this);
        this._wsHandleOnMessage = this._wsHandleOnMessage.bind(this);
        this._initiateSocket = this._initiateSocket.bind(this);
        this.webSocket = null;
        this.widgetMap = new Map();
        this.configMap = new Map();
        this.isConnected = false;
        this.isErrorOccured = false;
        this._initiateSocket();

    }

    registerWidgetCallback(widgetId, callBack) {
        this.widgetMap.set(widgetId, callBack);
    }

    unregisterWidgetCallback(widgetId) {
        this.widgetMap.delete(widgetId);
    }

    initiateProvider(widgetId,config) {
        this.webSocket.send(JSON.stringify(config));
    }

    _directDataToCallbak(data) {
        data = JSON.parse(data);
        // TODO: return JSON structure
    }

    _wsHandleOnMessage(message) {
        this._directDataToCallbak(message.data);
    }

    _wsOnError(msg) {
        this.isErrorOccured=true;
        this._waitForSocketConnection(this.webSocket);
    }

    _wsOnClose(msg) {
        if(this.isErrorOccured === true) {
            this._initiateSocket();
        } else {

        }
    }

    _initiateSocket() {
        this.webSocket = new WebSocket('wss://'); // TODO: Define Endpoint URL
        this.webSocket.onmessage = this._wsHandleOnMessage;
        this.isConnected = true;
    }

    _waitForSocketConnection(socket) {
        setTimeout(()=>{
            if(socket.readyState === 1) {
                this.isConnected=true;
                this.isErrorOccured=false;
            } else {
                this.isErrorOccured=true;
                this.isConnected=false;
                this._initiateSocket();
            }
        },1000);
    }
}