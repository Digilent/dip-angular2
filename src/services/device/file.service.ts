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
            this.transport.writeRead('/', dataToSend, 'binary').subscribe(
                (arrayBuffer) => {
                    let data;
                    try {
                        let stringify = String.fromCharCode.apply(null, new Uint8Array(arrayBuffer.slice(0)));
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

    listDir(location: string, path: string): Observable<any> {
        let command = {
            file: [{
                command: 'listdir',
                type: location,
                path: path
            }]
        };
        return this.genericResponse(command);
    }

    getFileSize(location: string, path: string): Observable<any> {
        let command = {
            file: [{
                command: 'getFileSize',
                type: location,
                path: path
            }]
        }
        return this.genericResponse(command);
    }

    getCurrentState(): Observable<FileCurrentStateResponse> {
        let command = {
            file: [{
                command: 'getCurrentState'
            }]
        };

        return this.genericResponse(command);
    }

    delete(location: string, paths: string | string[]): Observable<any> {
        let command = {
            file: []
        };

        let p = (typeof paths === 'string') ? [paths] : paths;
        p.forEach(path => {
            command.file.push({
                command: 'delete',
                type: location,
                path: path
            })
        });

        return this.genericResponse(command);
    }

    //Set the output voltage of the specified DC power supply channel.
    read(location: string, path: string, filePosition: number, length: number, timeoutOverride?: number): Observable<any> {
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
            this.transport.writeRead('/', JSON.stringify(command), 'json', timeoutOverride).subscribe(
                (arrayBuffer) => {
                    this.commandUtilService.observableParseChunkedTransfer(arrayBuffer, 'u8').subscribe(
                        (data) => {
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
                                file: this.safeStringBinary(binaryData)
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

    private safeStringBinary(binaryData: Uint8Array): string {
        let returnString = '';
        for (let i = 0; i < binaryData.length; i++) {
            returnString += String.fromCharCode(binaryData[i]);
        }
        return returnString;
    }

    private genericResponse(command): Observable<any> {
        return Observable.create((observer) => {
            this.transport.writeRead('/', JSON.stringify(command), 'json').subscribe(
                (arrayBuffer) => {
                    let data;
                    try {
                        let stringify = String.fromCharCode.apply(null, new Uint8Array(arrayBuffer.slice(0)));
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
                    if (data.file == undefined || (data.file[0] !== undefined && data.file[0].statusCode !== 0) || (data.file[0] === undefined && data.file.statusCode !== 0)) {
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

}

/**
 * FileCurrentStateReponse represents the documented 
 * structure of a reponse to a file:getCurrentState command
 */
export interface FileCurrentStateResponse {
    file: {
        command: "getCurrentState",
        statusCode: number,
        state: "deleting" | "idle",
        wait: number
    }
}