import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';

//Services
import { GenericTransportService } from './generic-transport.service';
import { HttpTransportComponent } from './http-transport.service';

@Injectable()
export class TransportService {
    public transport: GenericTransportService;

    constructor(_uri: string) {
        console.log('Transport Service Parent Constructor');
        this.transport = new HttpTransportComponent(_uri);
    }

    //Set transport uri
    setUri(uri) {
        this.transport.setUri(uri);
    }

    getUri() {
        return this.transport.getUri();
    }

    //Get request on the specified url
    getRequest(requestUrl: string): Observable<any> {
        return this.transport.getRequest(requestUrl);
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
        this.transport = new HttpTransportComponent(uri);
    }
}