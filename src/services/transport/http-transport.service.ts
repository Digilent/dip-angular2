import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';

//Services
import { GenericTransportService } from './generic-transport.service';

@Injectable()
export class HttpTransportService extends GenericTransportService {

    private streamState: {
        mode: string,
        remainingSamples: number
    };

    private start;
    private finish;

    constructor(_rootUri: string) {
        console.log('Transport HTTP Contructor');
        super();

        this.rootUri = _rootUri;
        this.streamState = {
            mode: 'off',
            remainingSamples: 0
        }
    }

    getUri() {
        return this.rootUri;
    }

    getRequest(requestUrl: string, timeout?: number): Observable<any> {
        timeout = timeout == undefined ? 5000 : timeout;
        return Observable.create((observer) => {
            let XHR = new XMLHttpRequest();

            XHR.addEventListener("load", (event: any) => {
                this.finish = performance.now();
                console.log('from start to fin');
                console.log(this.finish - this.start);
                observer.next(event.currentTarget.response);
                observer.complete();
            });

            XHR.addEventListener("error", (event) => {
                observer.error('Get Request Error', event);
            });

            XHR.addEventListener("timeout", (event) => {
                observer.error('Timeout', event);
            });

            try {
                XHR.open("GET", requestUrl);

                XHR.timeout = timeout;

                XHR.send();
                this.start = performance.now();
                console.log('command sent');
            }
            catch (err) {
                observer.error('TX Error: ', event);
            }
        });
    }

    //Data transmission wrapper to avoid duplicate code. 
    writeRead(endpoint: string, sendData: any, dataType: string): Observable<any> {
        return this.writeReadHelper(this.rootUri, endpoint, sendData, dataType);
    }

    writeReadHelper(rootUri: string, endpoint: string, sendData: any, dataType: string): Observable<any> {
        let uri = rootUri + endpoint;
        let body = sendData;
        console.log(body);
        return Observable.create((observer) => {
            let XHR = new XMLHttpRequest();


            // We define what will happen if the data are successfully sent
            XHR.addEventListener("load", (event: any) => {
                this.finish = performance.now();
                console.log('from start to fin');
                console.log(this.finish - this.start);
                observer.next(event.currentTarget.response);
                observer.complete();
            });

            // We define what will happen in case of error
            XHR.addEventListener("error", (event) => {
                observer.error('TX Error: ', event);
            });

            XHR.addEventListener("timeout", (event) => {
                observer.error('HTTP Timeout: ', event);
            });


            // We set up our request
            try {
                XHR.open("POST", uri);
                if (dataType === 'json') {
                    XHR.setRequestHeader("Content-Type", "application/json");
                }
                else if (dataType === 'binary') {
                    XHR.setRequestHeader("Content-Type", "application/octet-stream");
                }

                XHR.timeout = 5000;

                //Set resposne type as arraybuffer to receive response as bytes
                XHR.responseType = 'arraybuffer';

                XHR.send(body);
                this.start = performance.now();
                console.log('command sent');
            }
            catch (err) {
                observer.error('TX Error: ', event);
            }
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
                        //console.log('Inner Read ', i, ' >> ', data);
                        observer.next(data)
                    },
                    (err) => {
                        console.log(err);
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
        return 'http';
    }
}