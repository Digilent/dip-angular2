import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';

//Services
import { TransportContainerService } from '../../transport/transport-container.service';

@Injectable()
export abstract class GenericInstrumentService {

    readonly transport: TransportContainerService;

    readonly endpoint: string = '';
    abstract numChans: number;

    constructor(_transport: TransportContainerService, _endpoint: string) {
        this.transport = _transport;
        this.endpoint = _endpoint;
    }

    _genericResponseHandler(commandObject: Object): Observable<any> {
        return Observable.create((observer) => {
            this.transport.writeRead('/', JSON.stringify(commandObject), 'json').subscribe(
                (arrayBuffer) => {
                    let data;
                    try {
                        let stringify = String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0)));
                        console.log(stringify);
                        data = JSON.parse(stringify);
                    }
                    catch (e) {
                        observer.error(e);
                        return;
                    }
                    if (data == undefined || data.agent != undefined) {
                        observer.error(data);
                        return;
                    }
                    for (let instrument in data) {
                        if (instrument === 'log') {
                            for (let chanType in data[instrument]) {
                                if (chanType !== 'daq') {
                                    for (let channel in data[instrument][chanType]) {
                                        if (data[instrument][chanType][channel][0].statusCode > 0) {
                                            observer.error(data);
                                            return;
                                        }
                                    }
                                } else {
                                    if (data[instrument].statusCode > 0) {
                                        observer.error(data);
                                        return;
                                    }
                                }
                            } 
                        }
                        else {
                            for (let channel in data[instrument]) {
                                if (data[instrument][channel][0].statusCode > 0) {
                                    observer.error(data);
                                    return;
                                }
                            }
                        }
                    }
                    observer.next(data);
                    //Handle device errors and warnings
                    observer.complete();
                },
                (err) => {
                    observer.error(err);
                },
                () => {
                    observer.complete();
                }
            )
        });
    }
}