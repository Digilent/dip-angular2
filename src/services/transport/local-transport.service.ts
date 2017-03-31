import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';

//Services
import { GenericTransportService } from './generic-transport.service';
import { SimulatedDeviceService } from '../simulated-device/simulated-device.service';

@Injectable()
export class LocalTransportService extends GenericTransportService {

    public streamState: {
        mode: string,
        remainingSamples: number
    };
    public simulatedDevice: SimulatedDeviceService;

    constructor(deviceEnumeration: string) {
        super();
        this.streamState = {
            mode: 'off',
            remainingSamples: 0
        }
        this.simulatedDevice = new SimulatedDeviceService(deviceEnumeration);
    }

    getUri() {
        return this.rootUri;
    }

    getRequest(requestUrl: string) {
        return Observable.create((observer) => {
            observer.error('Local transport does not support get requests');
        });
    }

    //Data transmission wrapper to avoid duplicate code. 
    writeRead(endpoint: string, sendData: any, dataType: string): Observable<any> {
        return this.writeReadHelper(this.rootUri, endpoint, sendData, dataType);
    }

    writeReadHelper(rootUri: string, endpoint: string, sendData: any, dataType: string): Observable<any> {
        let body = sendData;
        return Observable.create((observer) => {
            this.simulatedDevice.send(body).subscribe(
                (data) => {
                    observer.next(data);
                },
                (err) => {
                    observer.error(err);
                },
                () => {

                }
            );
        });
    }

    //Stream via back to back xhr calls
    streamFrom(endpoint: string, sendData: any, dataType: string, delay = 0): Observable<any> {
        this.streamState.mode = 'continuous';

        return Observable.create((observer) => {
            let i = 0;

            let getData = function (writeReadHelper, streamState: any, rootUri: string, endpoint: string, sendData: Object, delay: number) {
                writeReadHelper(rootUri, endpoint, sendData).subscribe(
                    (data: any) => {
                        observer.next(data);
                    },
                    (err) => {
                        observer.error(err);
                        return;
                    },
                    () => {
                        i++;
                        if (streamState.mode == 'continuous') {
                            //Wrap getData in anaonymous function to allow passing parameters to setTimeout handler
                            setTimeout(() => {
                                getData(writeReadHelper, streamState, rootUri, endpoint, sendData, delay)
                            }, delay);
                        } else {
                            observer.complete();
                        }
                    });
            };
            getData(this.writeReadHelper, this.streamState, this.rootUri, endpoint, sendData, delay);
        });
    }

    //Sets stream to off
    stopStream() {
        this.streamState.mode = 'off';
    }

    //Get transport type
    getType() {
        return 'local';
    }
}