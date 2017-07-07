import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';

//Services
import { TransportContainerService } from '../transport/transport-container.service';
import { CommandUtilityService } from '../utilities/command-utility.service';

@Injectable()
export class FileService {
    private commandUtilService: CommandUtilityService; 

    constructor(
        private transport: TransportContainerService
    ) {
        this.commandUtilService = new CommandUtilityService();
    }

    //Set the output voltage of the specified DC power supply channel.
    write(location: string, path: string, file: ArrayBuffer, filePosition?: number): Observable<any> {
        filePosition = filePosition == undefined ? 0 : filePosition;
        let command = {
            file: [{
                command: 'write',
                type: location,
                path: path,
                filePosition: filePosition,
                binaryOffset: 0,
                binaryLength: file.byteLength
            }]
        };
        return Observable.create((observer) => {
            let dataToSend: Uint8Array = this.commandUtilService.createChunkedArrayBuffer(command, file);
            console.log(String.fromCharCode.apply(null, dataToSend));
            this.transport.writeRead('/', dataToSend, 'binary').subscribe(
                (arrayBuffer) => {
                    let data;
                    try {
                        let stringify = String.fromCharCode.apply(null, new Uint8Array(arrayBuffer.slice(0)));
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
                    if (data.file == undefined || data.file[0] == undefined || data.file[0].statusCode !== 0) {
                        observer.error(data);
                        return;
                    }
                    observer.next(data);
                    observer.complete();
                },
                (err) => {
                    observer.error(err);
                },
                () => {
                    observer.complete();
                }
            );
        });
    }

    //Set the output voltage of the specified DC power supply channel.
    read(location: string, path: string, filePosition: number, length: number): Observable<any> {
        let command = {
            file: [{
                command: 'read',
                type: location,
                path: path,
                filePosition: filePosition,
                requestedLength: length
            }]
        }
        return Observable.create((observer) => {
            this.transport.writeRead('/', JSON.stringify(command), 'json').subscribe(
                (arrayBuffer) => {
                    //Handle device errors and warnings
                    /*let data;
                    try {
                        data = JSON.parse(String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0))));
                    }
                    catch (e) {
                        observer.error(e);
                        return;
                    }

                    for (let i = 0; i < chans.length; i++) {
                        if (data.gpio == undefined || data.gpio[chans[i]][0].statusCode > 0 || data.agent != undefined) {
                            observer.error(data);
                            return;
                        }
                    }
                    observer.next(data);
                    observer.complete();*/
                    console.log(String.fromCharCode.apply(null, new Uint8Array(arrayBuffer)));
                    this.commandUtilService.observableParseChunkedTransfer(arrayBuffer, 'u8').subscribe(
                        (data) => {
                            console.log(data);
                            let jsonObject = data.json;
                            let binaryData: Uint8Array = data.typedArray;
                            if (data == undefined || data.agent != undefined) {
                                observer.error(data);
                                return;
                            }
                            if (jsonObject.file == undefined || jsonObject.file[0] == undefined || jsonObject.file[0].statusCode !== 0) {
                                observer.error(data);
                                return;
                            }
                            observer.next({
                                jsonObject: jsonObject,
                                file: String.fromCharCode.apply(null, binaryData)
                            });
                            observer.complete();
                        },
                        (err) => {
                            observer.error(err);
                        },
                        () => { }
                    );

                },
                (err) => {
                    observer.error(err);
                },
                () => {
                    observer.complete();
                }
            );
        });
    }

    private parseJsonResponse(commandObject: Object): Observable<any> {
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
                        for (let channel in data[instrument]) {
                            if (data[instrument][channel][0].statusCode > 0) {
                                observer.error(data);
                                return;
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
