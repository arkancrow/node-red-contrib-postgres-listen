# node-red-contrib-postgres-listen
A Node-RED node to listen to pg_notify

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-contrib-postgres-listen
    

Overview
-------

This add-on, allows to listen to PostgreSQL [pg_notify](https://www.postgresql.org/docs/9.0/static/sql-notify.html) mechanism.

The node takes two parameters :

- postgresdb : The PostgreSQL connection configuration
- channel : The channel name specified in the pg_notify command

PostgreSQL sample code
----------------------

1. Create a base table:

        CREATE TABLE realtime
        (
            id INTEGER DEFAULT nextval('realtime_id_seq'::regclass) NOT NULL,
            title CHARACTER VARYING(128),
            PRIMARY KEY (id)
        );

2. Create a trigger on the table:

        CREATE TRIGGER "updated_realtime_trigger"
          BEFORE INSERT OR DELETE OR UPDATE ON realtime
          FOR EACH ROW
        EXECUTE PROCEDURE notify_realtime()

3. Create a trigger function:

        CREATE FUNCTION public.notify_realtime()
            RETURNS trigger
            LANGUAGE 'plpgsql'
            COST 100.0
            VOLATILE NOT LEAKPROOF 
        AS $BODY$
        
        BEGIN
            PERFORM pg_notify('addedrecord', '' || row_to_json(NEW));
            RETURN NEW;
        END;
        $BODY$;

Result
------

The node will produce a message like that :

    {"name":"notification","length":47,"processId":16147,"channel":"addedrecord","payload":{"id":2,"title":"plopcsd"}}
    
All fields are generated by Postgres with *payload* being the content of the table row.

Changelog
---------
- 0.3.0 : Updated dependency on node-red-contrib-re-postgres to version 0.2.2.
- 0.2.0 : Removed the postgres configuration Node and created a dependency to https://flows.nodered.org/node/node-red-contrib-postgres making it possible to have both nodes installed.
