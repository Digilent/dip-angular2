import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';

@Injectable()
export abstract class GenericTransportService {

    protected rootUri: string;

    constructor() { }

    abstract writeRead(endpoint: string, sendData: any, dataType: string): Observable<any>;
    abstract streamFrom(endpoint: string, sendData: any, dataType: string, delay?: number): Observable<any>;
    abstract stopStream(): void;
    abstract getRequest(requestUrl: string): Observable<any>;

    //Update the URI used by the transport
    setUri(_rootUri: string) {
        this.rootUri = _rootUri;
    }

    getUri() {
        return this.rootUri;
    }

    //Get type of transport component (parent)
    getType() {
        return 'Parent';
    }
}