/**
 * Copyright 2017 Vincent Schoonenburg.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
module.exports = function(RED) {

    var pg = require('pg');

    function Notify(n) {
        RED.nodes.createNode(this,n);

        this.postgresdb = n.postgresdb;
        this.postgresConfig = RED.nodes.getNode(this.postgresdb);
        this.channel = n.channel;
        console.log(this.channel);
        var node = this;
        node.clientdb = null;
        this.status({fill:"red",shape:"ring",text:"disconnected"});

        if(this.postgresConfig) {
            try {
                var config = {};

                if (node.postgresConfig.connectionString) {
                    config = node.postgresConfig.connectionString
                } else {
                    if (node.postgresConfig.user) { config.user = node.postgresConfig.user; }
                    if (node.postgresConfig.password) { config.password = node.postgresConfig.password; }
                    if (node.postgresConfig.hostname) { config.host = node.postgresConfig.hostname; }
                    if (node.postgresConfig.port) { config.port = node.postgresConfig.port; }
                    if (node.postgresConfig.db) { config.database = node.postgresConfig.db; }
                    config.ssl = node.postgresConfig.ssl;
                }
                node.clientdb = new pg.Client(config);

                node.clientdb.connect(function(err) {
                    try {

                        if(err) {
                            console.log(err);
                            node.error(err);
                        } else {
                            console.log("Connected");
                            node.status({fill:"green",shape:"dot",text:"connected"});
                            node.clientdb.on('notification', function(msg) {
                                try {
                                    //console.log("Notification received");
                                    msg.payload = JSON.parse(msg.payload);
                                    //node.log(JSON.stringify(msg));
                                    node.send(msg);
                                } catch (error) {
                                    node.error(error);
                                }
                            });
                            var query = "LISTEN " + node.channel;
                            node.clientdb.query(query);
                            console.log("Listening to :" + node.channel);
                        }
                    } catch (error) {
                        node.error(error);
                    }
                });

            } catch (err) {
                node.error(err);
            }

        } else {
            this.error("missing postgres configuration");
        }

        this.on("close", function() {
            if(node.clientdb) node.clientdb.end();
        });
    }


    function PostgresArrayNode(n) {
        RED.nodes.createNode(this,n);

        try {
            this.columns = JSON.parse(n.columns);
        } catch (e) {
            node.error(e.message);
            this.columns = [];
        }
    }
    try {
        RED.nodes.registerType("postgresarray",PostgresArrayNode);
    } catch (e) {

    }

    RED.nodes.registerType("PG Listen",Notify);
};
