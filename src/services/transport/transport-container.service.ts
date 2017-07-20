import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';

//Services
import { GenericTransportService } from './generic-transport.service';
import { HttpTransportService } from './http-transport.service';
import { LocalTransportService } from './local-transport.service';

@Injectable()
export class TransportContainerService {
    public transport: GenericTransportService;
    private httpTimeout: number;

    constructor(_uri: string, httpTimeout: number) {
        this.transport = new HttpTransportService(_uri, httpTimeout);
        this.httpTimeout = httpTimeout;
    }

    //Set transport uri
    setUri(uri) {
        this.transport.setUri(uri);
    }

    getUri() {
        return this.transport.getUri();
    }

    //Get request on the specified url
    getRequest(requestUrl: string, timeout?: number): Observable<any> {
        return this.transport.getRequest(requestUrl, timeout);
    }

    //Call writeRead on transport component
    writeRead(endpoint: string, sendData: any, dataType: string): Observable<any> {
        return this.transport.writeRead(endpoint, sendData, dataType);
    }

    //Call streamFrom on stransport component
    streamFrom(endpoint: string, sendData: Object, dataType: string, delay = 0): Observable<any> {
        return this.transport.streamFrom(endpoint, sendData, dataType, delay);
    }

    //Stop all transport streams
    stopStream() {
        this.transport.stopStream();
    }

    //Get type of transport service
    getType() {
        return this.transport.getType();
    }

    setHttpTransport(uri) {
        delete this.transport;
        this.transport = new HttpTransportService(uri, this.httpTimeout);
    }

    setLocalTransport(deviceEnumeration: string) {
        delete this.transport;
        this.transport = new LocalTransportService(deviceEnumeration);
    }

    setHttpTimeout(newHttpTimeout: number) {
        this.httpTimeout = newHttpTimeout;
        this.transport.setTimeout(newHttpTimeout);
    }
}